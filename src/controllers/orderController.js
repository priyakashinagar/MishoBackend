/**
 * @fileoverview Order controller for order operations
 * @module controllers/orderController
 */

const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * Generate unique order ID
 */
const generateOrderId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MEE${timestamp}${random}`;
};

/**
 * @desc    Place order
 * @route   POST /api/v1/order/place
 * @access  Private
 */
exports.placeOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress,
      paymentMethod = 'cod',
      useCart = true,
      items: directItems,
      notes = ''
    } = req.body;

    // Format shipping address - handle both simple and detailed formats
    let formattedAddress;
    if (shippingAddress) {
      if (shippingAddress.fullName || shippingAddress.addressLine1) {
        // Already in proper format
        formattedAddress = shippingAddress;
      } else {
        // Simple format - convert to proper format
        formattedAddress = {
          fullName: shippingAddress.name || req.user?.name || 'Customer',
          phone: shippingAddress.phone || req.user?.phone || '',
          addressLine1: shippingAddress.address || shippingAddress.addressLine1 || 'Address not provided',
          addressLine2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city || 'City',
          state: shippingAddress.state || 'State',
          pincode: shippingAddress.pincode || shippingAddress.zipCode || '000000',
          landmark: shippingAddress.landmark || ''
        };
      }
    } else {
      return next(new AppError('Shipping address is required', 400));
    }

    let orderItems = [];
    let itemsTotal = 0;

    if (useCart) {
      // Get cart items
      const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      
      if (!cart || cart.items.length === 0) {
        return next(new AppError('Cart is empty', 400));
      }

      // Validate stock and prepare order items
      for (const item of cart.items) {
        const product = await Product.findById(item.product._id).populate('seller');
        
        if (!product) {
          return next(new AppError(`Product ${item.product.name} not found`, 404));
        }

        if (product.stock.quantity < item.quantity) {
          return next(new AppError(`Insufficient stock for ${product.name}`, 400));
        }

        // Get seller ID - use product.seller or req.user as fallback
        let sellerId = product.seller?._id || product.seller;
        if (!sellerId) {
          // If no seller, use the current user (for admin-created products)
          sellerId = req.user._id;
          logger.warn(`Product ${product._id} has no seller, using user ${req.user._id} as fallback`);
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.images?.[0]?.url || '',
          price: item.price,
          quantity: item.quantity,
          variant: `${item.size} / ${item.color}`.trim(),
          seller: sellerId
        });

        itemsTotal += item.price * item.quantity;
      }
    } else {
      // Direct order (Buy Now)
      if (!directItems || directItems.length === 0) {
        return next(new AppError('No items provided', 400));
      }

      for (const item of directItems) {
        const product = await Product.findById(item.productId).populate('seller');
        
        if (!product) {
          return next(new AppError('Product not found', 404));
        }

        if (product.stock.quantity < item.quantity) {
          return next(new AppError(`Insufficient stock for ${product.name}`, 400));
        }

        // Get seller ID - use product.seller or req.user as fallback
        let sellerId = product.seller?._id || product.seller;
        if (!sellerId) {
          // If no seller, use the current user (for admin-created products)
          sellerId = req.user._id;
          logger.warn(`Product ${product._id} has no seller, using user ${req.user._id} as fallback`);
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.images?.[0]?.url || '',
          price: product.price,
          quantity: item.quantity || 1,
          variant: `${item.size || 'Free Size'} / ${item.color || ''}`.trim(),
          seller: sellerId
        });

        itemsTotal += product.price * (item.quantity || 1);
      }
    }

    // Calculate pricing
    const shippingCharge = itemsTotal >= 500 ? 0 : 40;
    const discount = paymentMethod === 'online' ? Math.round(itemsTotal * 0.03) : 0;
    const total = itemsTotal + shippingCharge - discount;

    // Create order
    const order = await Order.create({
      orderId: generateOrderId(),
      user: req.user._id,
      items: orderItems,
      shippingAddress: formattedAddress,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cod' ? 'pending' : 'pending'
      },
      pricing: {
        itemsTotal,
        shippingCharge,
        discount,
        total
      },
      notes: notes || '',
      status: 'confirmed',
      statusHistory: [{
        status: 'confirmed',
        comment: 'Order placed successfully',
        timestamp: new Date()
      }]
    });

    // Update product stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 
          'stock.quantity': -item.quantity,
          soldCount: item.quantity
        }
      });
    }

    // Clear cart if using cart
    if (useCart) {
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        { items: [], totalItems: 0, totalPrice: 0 }
      );
    }

    logger.info(`Order placed: ${order.orderId} by user: ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    logger.error('Error placing order:', error);
    next(error);
  }
};

/**
 * @desc    Get user orders
 * @route   GET /api/v1/order/user
 * @access  Private
 */
exports.getUserOrders = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status,
      search,
      // Order status filters
      onTheWay,
      delivered,
      cancelled,
      returned,
      // Time filters
      last30Days,
      year
    } = req.query;

    const query = { user: req.user._id };
    
    // Status filter - multiple statuses allowed
    const statusFilters = [];
    if (onTheWay === 'true') {
      statusFilters.push('confirmed', 'processing', 'shipped', 'out_for_delivery');
    }
    if (delivered === 'true') {
      statusFilters.push('delivered');
    }
    if (cancelled === 'true') {
      statusFilters.push('cancelled');
    }
    if (returned === 'true') {
      statusFilters.push('returned', 'refunded');
    }
    
    // Apply status filter if any selected
    if (statusFilters.length > 0) {
      query.status = { $in: statusFilters };
    } else if (status) {
      // Backward compatibility - single status
      query.status = status;
    }
    
    // Time filter
    if (last30Days === 'true') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    } else if (year) {
      const yearNum = parseInt(year);
      if (year === 'older') {
        // Orders before 2023
        query.createdAt = { $lt: new Date('2023-01-01') };
      } else if (!isNaN(yearNum)) {
        query.createdAt = {
          $gte: new Date(`${yearNum}-01-01`),
          $lt: new Date(`${yearNum + 1}-01-01`)
        };
      }
    }
    
    // Search by order ID or product name
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: orders
    });
  } catch (error) {
    logger.error('Error fetching user orders:', error);
    next(error);
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/v1/order/:orderId
 * @access  Private
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const orderIdParam = req.params.orderId;
    
    // Try to find order by orderId or MongoDB _id
    let order;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
      order = await Order.findById(orderIdParam)
        .populate('items.product', 'name images price')
        .populate('user', 'name email phone');
    }
    if (!order) {
      order = await Order.findOne({ orderId: orderIdParam })
        .populate('items.product', 'name images price')
        .populate('user', 'name email phone');
    }

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check authorization
    if (order.user._id.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin' && 
        req.user.role !== 'seller') {
      return next(new AppError('Not authorized to view this order', 403));
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error fetching order:', error);
    next(error);
  }
};

/**
 * @desc    Get seller orders
 * @route   GET /api/v1/order/seller
 * @access  Private (Seller)
 */
exports.getSellerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Get seller ID
    const Seller = require('../models/Seller');
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return next(new AppError('Seller profile not found', 404));
    }

    const query = { 'items.seller': seller._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .populate('user', 'name phone')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(query);

    // Transform orders to include totalAmount and orderNumber for frontend compatibility
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.totalAmount = order.pricing?.total || 0;
      orderObj.orderNumber = order.orderId;
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      orders: transformedOrders,
      data: transformedOrders
    });
  } catch (error) {
    logger.error('Error fetching seller orders:', error);
    next(error);
  }
};

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/v1/order/admin
 * @access  Private (Admin)
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name images')
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(query);

    // Get order stats
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$pricing.total' }
        }
      }
    ]);

    // Transform orders to include totalAmount and orderNumber for frontend compatibility
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      orderObj.totalAmount = order.pricing?.total || 0;
      orderObj.orderNumber = order.orderId;
      return orderObj;
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      stats,
      orders: transformedOrders,
      data: transformedOrders
    });
  } catch (error) {
    logger.error('Error fetching all orders:', error);
    next(error);
  }
};

/**
 * @desc    Update order status
 * @route   PUT /api/v1/order/update/:orderId
 * @access  Private (Seller/Admin)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status, comment, trackingId, courier } = req.body;
    const orderIdParam = req.params.orderId;
    
    // Try to find order by orderId or MongoDB _id
    let order;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
      order = await Order.findById(orderIdParam);
    }
    if (!order) {
      order = await Order.findOne({ orderId: orderIdParam });
    }
    
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Validate status transition
    const validTransitions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered'],
      delivered: ['returned'],
      cancelled: [],
      returned: ['refunded'],
      refunded: []
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return next(new AppError(`Cannot change status from ${order.status} to ${status}`, 400));
    }

    order.status = status;
    order.statusHistory.push({
      status,
      comment,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    // Update tracking info
    if (trackingId) {
      order.tracking = {
        courier,
        trackingId,
        url: ''
      };
    }

    // Update timestamps
    if (status === 'shipped') order.shippedAt = new Date();
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.payment.status = 'completed';
      if (order.payment.method === 'cod') {
        order.payment.paidAt = new Date();
      }
    }
    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancellationReason = comment;
      
      // Restore stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { 'stock.quantity': item.quantity }
        });
      }
    }

    await order.save();

    logger.info(`Order ${order.orderId} status updated to ${status}`);

    res.status(200).json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    logger.error('Error updating order status:', error);
    next(error);
  }
};

/**
 * @desc    Cancel order
 * @route   PUT /api/v1/order/cancel/:orderId
 * @access  Private
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const orderIdParam = req.params.orderId;
    
    // Try to find order by orderId or MongoDB _id
    let order;
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(orderIdParam)) {
      order = await Order.findById(orderIdParam);
    }
    if (!order) {
      order = await Order.findOne({ orderId: orderIdParam });
    }
    
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check authorization - Only the user who placed the order can cancel it
    if (order.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to cancel this order', 403));
    }

    // Can only cancel pending/confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return next(new AppError('Order cannot be cancelled at this stage', 400));
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.statusHistory.push({
      status: 'cancelled',
      comment: reason,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { 'stock.quantity': item.quantity }
      });
    }

    await order.save();

    logger.info(`Order ${order.orderId} cancelled by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    logger.error('Error cancelling order:', error);
    next(error);
  }
};

/**
 * @desc    Request return
 * @route   POST /api/v1/orders/return/:orderId
 * @access  Private
 */
exports.requestReturn = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check authorization
    if (order.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized', 403));
    }

    // Can only return delivered orders within 7 days
    if (order.status !== 'delivered') {
      return next(new AppError('Only delivered orders can be returned', 400));
    }

    const daysSinceDelivery = Math.floor(
      (Date.now() - order.deliveredAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceDelivery > 7) {
      return next(new AppError('Return window has expired (7 days)', 400));
    }

    // Update order with return request
    order.status = 'return_requested';
    order.returnReason = reason;
    order.returnRequest = {
      requested: true,
      reason,
      status: 'pending',
      requestedAt: new Date()
    };

    await order.save();

    logger.info(`Return requested for order ${order.orderId} by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Return request submitted successfully',
      data: order
    });
  } catch (error) {
    logger.error('Error requesting return:', error);
    next(error);
  }
};
