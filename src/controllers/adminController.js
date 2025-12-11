/**
 * @fileoverview Admin controller
 * @module controllers/adminController
 */

const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Rating = require('../models/Rating');
const PayoutTransaction = require('../models/PayoutTransaction');
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Get admin dashboard stats
 * @route GET /api/v1/admin/dashboard
 * @access Private/Admin
 */
exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalSellers = await Seller.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const pendingSellers = await Seller.countDocuments({ kycStatus: 'submitted' });
    const verifiedSellers = await Seller.countDocuments({ isVerified: true });
    
    const totalRevenue = await Order.aggregate([
      { $match: { 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);

    // Recent activity
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email');

    const recentSellers = await Seller.find({ kycStatus: 'submitted' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    sendSuccess(res, 200, 'Dashboard stats retrieved successfully', {
      stats: {
        totalUsers,
        totalSellers,
        totalProducts,
        totalOrders,
        pendingSellers,
        verifiedSellers,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders,
      recentSellers
    });
  } catch (error) {
    logger.error(`Get admin dashboard error: ${error.message}`);
    sendError(res, 500, 'Error retrieving dashboard stats');
  }
};

/**
 * Get all users
 * @route GET /api/v1/admin/users
 * @access Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    sendPaginatedResponse(res, 200, 'Users retrieved successfully', users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Get all users error: ${error.message}`);
    sendError(res, 500, 'Error retrieving users');
  }
};

/**
 * Get user by ID
 * @route GET /api/v1/admin/users/:userId
 * @access Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Get user orders
    const orders = await Order.find({ user: user._id }).limit(10);

    sendSuccess(res, 200, 'User retrieved successfully', { user, orders });
  } catch (error) {
    logger.error(`Get user by ID error: ${error.message}`);
    sendError(res, 500, 'Error retrieving user');
  }
};

/**
 * Update user status
 * @route PUT /api/v1/admin/users/:userId/status
 * @access Private/Admin
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendSuccess(res, 200, `User ${isActive ? 'activated' : 'deactivated'} successfully`, { user });
  } catch (error) {
    logger.error(`Update user status error: ${error.message}`);
    sendError(res, 500, 'Error updating user status');
  }
};

/**
 * Get all sellers
 * @route GET /api/v1/admin/sellers
 * @access Private/Admin
 */
exports.getAllSellers = async (req, res) => {
  try {
    const { page = 1, limit = 20, kycStatus, isVerified } = req.query;

    const query = {};
    if (kycStatus) query.kycStatus = kycStatus;
    if (isVerified !== undefined) query.isVerified = isVerified === 'true';

    const sellers = await Seller.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Seller.countDocuments(query);

    sendPaginatedResponse(res, 200, 'Sellers retrieved successfully', sellers, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Get all sellers error: ${error.message}`);
    sendError(res, 500, 'Error retrieving sellers');
  }
};

/**
 * Get seller by ID
 * @route GET /api/v1/admin/sellers/:sellerId
 * @access Private/Admin
 */
exports.getSellerById = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.sellerId).populate('user', '-password');
    
    if (!seller) {
      return sendError(res, 404, 'Seller not found');
    }

    // Get seller products and orders
    const products = await Product.find({ seller: seller._id }).limit(10);
    const orders = await Order.find({ 'items.seller': seller._id }).limit(10);

    sendSuccess(res, 200, 'Seller retrieved successfully', { seller, products, orders });
  } catch (error) {
    logger.error(`Get seller by ID error: ${error.message}`);
    sendError(res, 500, 'Error retrieving seller');
  }
};

/**
 * Verify seller KYC
 * @route PUT /api/v1/admin/sellers/:sellerId/verify
 * @access Private/Admin
 */
exports.verifySeller = async (req, res) => {
  try {
    const { approved, rejectionReason } = req.body;
    
    const seller = await Seller.findById(req.params.sellerId);
    if (!seller) {
      return sendError(res, 404, 'Seller not found');
    }

    if (approved) {
      seller.kycStatus = 'approved';
      seller.isVerified = true;
      seller.verifiedAt = Date.now();
      seller.verifiedBy = req.user._id;
    } else {
      seller.kycStatus = 'rejected';
      seller.kycRejectionReason = rejectionReason;
    }

    await seller.save();

    sendSuccess(res, 200, `Seller ${approved ? 'verified' : 'rejected'} successfully`, { seller });
  } catch (error) {
    logger.error(`Verify seller error: ${error.message}`);
    sendError(res, 500, 'Error verifying seller');
  }
};

/**
 * Update seller status
 * @route PUT /api/v1/admin/sellers/:sellerId/status
 * @access Private/Admin
 */
exports.updateSellerStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const seller = await Seller.findByIdAndUpdate(
      req.params.sellerId,
      { isActive },
      { new: true }
    );

    if (!seller) {
      return sendError(res, 404, 'Seller not found');
    }

    sendSuccess(res, 200, `Seller ${isActive ? 'activated' : 'deactivated'} successfully`, { seller });
  } catch (error) {
    logger.error(`Update seller status error: ${error.message}`);
    sendError(res, 500, 'Error updating seller status');
  }
};

/**
 * Get all products
 * @route GET /api/v1/admin/products
 * @access Private/Admin
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate('seller', 'shopName')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    sendPaginatedResponse(res, 200, 'Products retrieved successfully', products, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Get all products error: ${error.message}`);
    sendError(res, 500, 'Error retrieving products');
  }
};

/**
 * Delete product
 * @route DELETE /api/v1/admin/products/:productId
 * @access Private/Admin
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    
    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    sendSuccess(res, 200, 'Product deleted successfully');
  } catch (error) {
    logger.error(`Delete product error: ${error.message}`);
    sendError(res, 500, 'Error deleting product');
  }
};

/**
 * Get all orders
 * @route GET /api/v1/admin/orders
 * @access Private/Admin
 */
exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    sendPaginatedResponse(res, 200, 'Orders retrieved successfully', orders, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Get all orders error: ${error.message}`);
    sendError(res, 500, 'Error retrieving orders');
  }
};

/**
 * Get platform analytics
 * @route GET /api/v1/admin/analytics
 * @access Private/Admin
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Sales analytics
    const salesData = await Order.aggregate([
      { $match: { ...dateFilter, 'payment.status': 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalSales: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Category-wise sales
    const categoryStats = await Order.aggregate([
      { $match: { ...dateFilter, 'payment.status': 'completed' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          productCount: { $sum: 1 }
        }
      }
    ]);

    sendSuccess(res, 200, 'Analytics retrieved successfully', {
      salesData,
      categoryStats
    });
  } catch (error) {
    logger.error(`Get analytics error: ${error.message}`);
    sendError(res, 500, 'Error retrieving analytics');
  }
};

/**
 * Get all returns/return requests
 * @route GET /api/v1/admin/returns
 * @access Private/Admin
 */
exports.getReturns = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { 'return.requested': true };
    if (status) query['return.status'] = status;

    const returns = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images')
      .sort({ 'return.requestedAt': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Transform to return-focused format
    const returnData = returns.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      user: order.user,
      product: order.items[0]?.name || 'N/A',
      productImage: order.items[0]?.image,
      amount: order.pricing?.total || 0,
      status: order.return?.status || 'pending',
      reason: order.return?.reason || '',
      requestedAt: order.return?.requestedAt || order.updatedAt,
      createdAt: order.createdAt
    }));

    sendPaginatedResponse(res, 200, 'Returns retrieved successfully', returnData, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Get returns error: ${error.message}`);
    sendError(res, 500, 'Error retrieving returns');
  }
};

/**
 * Update return status
 * @route PUT /api/v1/admin/returns/:orderId
 * @access Private/Admin
 */
exports.updateReturnStatus = async (req, res) => {
  try {
    const { status, refundAmount } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    order.return = {
      ...order.return,
      status,
      processedAt: Date.now(),
      processedBy: req.user._id,
      refundAmount: refundAmount || order.pricing?.total
    };

    if (status === 'approved') {
      order.status = 'returned';
      order.payment.status = 'refunded';
    }

    await order.save();

    sendSuccess(res, 200, 'Return status updated successfully', { order });
  } catch (error) {
    logger.error(`Update return status error: ${error.message}`);
    sendError(res, 500, 'Error updating return status');
  }
};

/**
 * Get sales reports
 * @route GET /api/v1/admin/reports/sales
 * @access Private/Admin
 */
exports.getSalesReports = async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let groupFormat;
    if (period === 'daily') {
      groupFormat = '%Y-%m-%d';
    } else if (period === 'weekly') {
      groupFormat = '%Y-W%V';
    } else {
      groupFormat = '%Y-%m';
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          },
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          totalSales: { $sum: '$pricing.total' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$pricing.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format for frontend
    const reports = salesData.map((item, index) => ({
      id: index + 1,
      month: item._id,
      sales: item.totalSales || 0,
      orders: item.orderCount || 0,
      avgOrderValue: Math.round(item.avgOrderValue || 0)
    }));

    // Calculate totals
    const totals = {
      totalSales: reports.reduce((sum, r) => sum + r.sales, 0),
      totalOrders: reports.reduce((sum, r) => sum + r.orders, 0),
      avgOrderValue: reports.length > 0 
        ? Math.round(reports.reduce((sum, r) => sum + r.avgOrderValue, 0) / reports.length)
        : 0
    };

    sendSuccess(res, 200, 'Sales reports retrieved successfully', { reports, totals });
  } catch (error) {
    logger.error(`Get sales reports error: ${error.message}`);
    sendError(res, 500, 'Error retrieving sales reports');
  }
};

/**
 * Get customers (users with orders)
 * @route GET /api/v1/admin/customers
 * @access Private/Admin
 */
exports.getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const matchStage = { role: 'user' };
    if (search) {
      matchStage.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'user',
          as: 'orders'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          phone: 1,
          isActive: 1,
          createdAt: 1,
          totalOrders: { $size: '$orders' },
          totalSpent: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: '$$order.pricing.total'
              }
            }
          }
        }
      },
      { $sort: { totalOrders: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    const total = await User.countDocuments(matchStage);

    sendPaginatedResponse(res, 200, 'Customers retrieved successfully', customers, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Get customers error: ${error.message}`);
    sendError(res, 500, 'Error retrieving customers');
  }
};

/**
 * Get payments/transactions
 * @route GET /api/v1/admin/payments
 * @access Private/Admin
 */
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, method, search } = req.query;

    const query = {};
    if (status) query['payment.status'] = status;
    if (method) query['payment.method'] = method;

    const payments = await Order.find(query)
      .select('orderId user payment pricing createdAt')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Calculate payment stats from all orders
    const allOrders = await Order.find({}).select('payment pricing');
    let totalAmount = 0, completedAmount = 0, pendingAmount = 0, failedAmount = 0, refundedAmount = 0;
    
    allOrders.forEach(order => {
      const amount = order.pricing?.total || 0;
      totalAmount += amount;
      
      const paymentStatus = order.payment?.status || 'pending';
      if (paymentStatus === 'completed' || paymentStatus === 'paid') {
        completedAmount += amount;
      } else if (paymentStatus === 'pending') {
        pendingAmount += amount;
      } else if (paymentStatus === 'failed') {
        failedAmount += amount;
      } else if (paymentStatus === 'refunded') {
        refundedAmount += amount;
      }
    });

    // Transform to payment format
    const paymentData = payments.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      customerName: order.user?.name || 'N/A',
      customerEmail: order.user?.email || '',
      amount: order.pricing?.total || 0,
      method: order.payment?.method || 'COD',
      status: order.payment?.status || 'pending',
      transactionId: order.payment?.transactionId,
      date: order.createdAt
    }));

    sendSuccess(res, 200, 'Payments retrieved successfully', {
      payments: paymentData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats: {
        total: totalAmount,
        completed: completedAmount,
        pending: pendingAmount,
        failed: failedAmount,
        refunded: refundedAmount
      }
    });
  } catch (error) {
    logger.error(`Get payments error: ${error.message}`);
    sendError(res, 500, 'Error retrieving payments');
  }
};

/**
 * Get all reviews
 * @route GET /api/v1/admin/reviews
 * @access Private/Admin
 */
exports.getReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, rating } = req.query;

    const query = {};
    if (rating) query.rating = parseInt(rating);

    const reviews = await Rating.find(query)
      .populate('user', 'name email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments(query);

    // Calculate stats
    const stats = await Rating.aggregate([
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStars: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    sendPaginatedResponse(res, 200, 'Reviews retrieved successfully', reviews, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      stats: stats[0] || {}
    });
  } catch (error) {
    logger.error(`Get reviews error: ${error.message}`);
    sendError(res, 500, 'Error retrieving reviews');
  }
};

/**
 * Delete review
 * @route DELETE /api/v1/admin/reviews/:reviewId
 * @access Private/Admin
 */
exports.deleteReview = async (req, res) => {
  try {
    const review = await Rating.findByIdAndDelete(req.params.reviewId);
    
    if (!review) {
      return sendError(res, 404, 'Review not found');
    }

    sendSuccess(res, 200, 'Review deleted successfully');
  } catch (error) {
    logger.error(`Delete review error: ${error.message}`);
    sendError(res, 500, 'Error deleting review');
  }
};

/**
 * Get shipping/shipments
 * @route GET /api/v1/admin/shipping
 * @access Private/Admin
 */
exports.getShipments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { status: { $in: ['confirmed', 'processing', 'shipped', 'out_for_delivery'] } };
    if (status) query.status = status;

    const shipments = await Order.find(query)
      .select('orderId user shippingAddress status tracking createdAt updatedAt')
      .populate('user', 'name phone')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(query);

    // Transform to shipment format
    const shipmentData = shipments.map((order, index) => ({
      _id: order._id,
      shipmentId: `SHIP-${String(index + 1).padStart(3, '0')}`,
      orderId: order.orderId,
      customer: order.user?.name || 'N/A',
      phone: order.user?.phone || order.shippingAddress?.phone,
      address: `${order.shippingAddress?.city}, ${order.shippingAddress?.state}`,
      fullAddress: order.shippingAddress,
      status: order.status,
      trackingNumber: order.tracking?.trackingNumber,
      carrier: order.tracking?.carrier || 'Meesho Logistics',
      estimatedDelivery: order.tracking?.estimatedDelivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    sendPaginatedResponse(res, 200, 'Shipments retrieved successfully', shipmentData, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Get shipments error: ${error.message}`);
    sendError(res, 500, 'Error retrieving shipments');
  }
};

/**
 * Update shipment/tracking
 * @route PUT /api/v1/admin/shipping/:orderId
 * @access Private/Admin
 */
exports.updateShipment = async (req, res) => {
  try {
    const { status, trackingNumber, carrier, estimatedDelivery } = req.body;

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    if (status) order.status = status;
    order.tracking = {
      ...order.tracking,
      trackingNumber: trackingNumber || order.tracking?.trackingNumber,
      carrier: carrier || order.tracking?.carrier,
      estimatedDelivery: estimatedDelivery || order.tracking?.estimatedDelivery,
      updatedAt: Date.now()
    };

    await order.save();

    sendSuccess(res, 200, 'Shipment updated successfully', { order });
  } catch (error) {
    logger.error(`Update shipment error: ${error.message}`);
    sendError(res, 500, 'Error updating shipment');
  }
};

/**
 * Get store settings
 * @route GET /api/v1/admin/settings
 * @access Private/Admin
 */
exports.getSettings = async (req, res) => {
  try {
    // For now, return default settings (can be stored in a Settings collection later)
    const settings = {
      storeName: process.env.STORE_NAME || 'Meesho',
      currency: process.env.CURRENCY || 'INR',
      taxRate: process.env.TAX_RATE || '18',
      shippingCharge: process.env.SHIPPING_CHARGE || '40',
      freeShippingThreshold: process.env.FREE_SHIPPING_THRESHOLD || '499',
      contactEmail: process.env.CONTACT_EMAIL || 'support@meesho.com',
      contactPhone: process.env.CONTACT_PHONE || '1800-123-4567',
      address: process.env.STORE_ADDRESS || 'Bangalore, Karnataka, India',
      returnPolicy: '7 days return policy',
      codEnabled: true,
      onlinePaymentEnabled: true
    };

    sendSuccess(res, 200, 'Settings retrieved successfully', { settings });
  } catch (error) {
    logger.error(`Get settings error: ${error.message}`);
    sendError(res, 500, 'Error retrieving settings');
  }
};

/**
 * Update store settings
 * @route PUT /api/v1/admin/settings
 * @access Private/Admin
 */
exports.updateSettings = async (req, res) => {
  try {
    // In production, save to database. For now, just return the updated settings
    const settings = req.body;

    sendSuccess(res, 200, 'Settings updated successfully', { settings });
  } catch (error) {
    logger.error(`Update settings error: ${error.message}`);
    sendError(res, 500, 'Error updating settings');
  }
};

/**
 * Get seller KYC submissions
 * @route GET /api/v1/admin/kyc
 * @access Private/Admin
 */
exports.getKYCSubmissions = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = {};
    if (status) query.kycStatus = status;

    const sellers = await Seller.find(query)
      .populate('user', 'name email phone')
      .select('shopName kycStatus kycDocuments gstNumber panNumber businessType createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Seller.countDocuments(query);

    // Get counts by status
    const pendingCount = await Seller.countDocuments({ kycStatus: 'pending' });
    const submittedCount = await Seller.countDocuments({ kycStatus: 'submitted' });
    const approvedCount = await Seller.countDocuments({ kycStatus: 'approved' });
    const rejectedCount = await Seller.countDocuments({ kycStatus: 'rejected' });

    sendPaginatedResponse(res, 200, 'KYC submissions retrieved successfully', sellers, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      stats: { pending: pendingCount, submitted: submittedCount, approved: approvedCount, rejected: rejectedCount }
    });
  } catch (error) {
    logger.error(`Get KYC submissions error: ${error.message}`);
    sendError(res, 500, 'Error retrieving KYC submissions');
  }
};

/**
 * Get seller management data
 * @route GET /api/v1/admin/seller-management
 * @access Private/Admin
 */
exports.getSellerManagement = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const matchStage = {};
    if (search) {
      matchStage.$or = [
        { shopName: { $regex: search, $options: 'i' } }
      ];
    }

    const sellers = await Seller.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'seller',
          as: 'products'
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { sellerId: '$_id' },
          pipeline: [
            { $unwind: '$items' },
            { $match: { $expr: { $eq: ['$items.seller', '$$sellerId'] } } }
          ],
          as: 'orders'
        }
      },
      {
        $project: {
          _id: 1,
          shopName: 1,
          businessType: 1,
          isVerified: 1,
          isActive: 1,
          kycStatus: 1,
          createdAt: 1,
          'userInfo.name': 1,
          'userInfo.email': 1,
          'userInfo.phone': 1,
          totalProducts: { $size: '$products' },
          totalOrders: { $size: '$orders' },
          totalEarnings: {
            $sum: {
              $map: {
                input: '$orders',
                as: 'order',
                in: { $multiply: ['$$order.items.price', '$$order.items.quantity'] }
              }
            }
          }
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    const total = await Seller.countDocuments(matchStage);

    sendPaginatedResponse(res, 200, 'Seller management data retrieved successfully', sellers, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(`Get seller management error: ${error.message}`);
    sendError(res, 500, 'Error retrieving seller management data');
  }
};

/**
 * Submit help/support ticket
 * @route POST /api/v1/admin/support
 * @access Private
 */
exports.submitSupportTicket = async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;

    // In production, save to database or send to support system
    const ticket = {
      ticketId: `TKT-${Date.now().toString(36).toUpperCase()}`,
      name,
      email,
      subject,
      message,
      category: category || 'general',
      status: 'open',
      createdAt: new Date()
    };

    // Log for now (in production, save to DB)
    logger.info(`Support ticket created: ${ticket.ticketId}`);

    sendSuccess(res, 201, 'Support ticket submitted successfully', { ticket });
  } catch (error) {
    logger.error(`Submit support ticket error: ${error.message}`);
    sendError(res, 500, 'Error submitting support ticket');
  }
};

/**
 * Get all earnings for admin (platform commission earnings)
 * @route GET /api/v1/admin/earnings
 * @access Private/Admin
 */
exports.getEarnings = async (req, res) => {
  try {
    const { page = 1, limit = 20, period = '6months' } = req.query;

    // Calculate date range based on period
    let startDate = new Date();
    if (period === '1month') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === '3months') startDate.setMonth(startDate.getMonth() - 3);
    else if (period === '6months') startDate.setMonth(startDate.getMonth() - 6);
    else if (period === '1year') startDate.setFullYear(startDate.getFullYear() - 1);
    else startDate = new Date(0); // All time

    // Get delivered orders with calculated earnings
    const orders = await Order.find({
      status: 'delivered',
      createdAt: { $gte: startDate },
      'earnings.platformCommission': { $exists: true, $gt: 0 }
    })
    .populate('user', 'name email')
    .populate('items.seller', 'shopName businessName')
    .sort({ deliveredAt: -1 });

    // Calculate admin earnings (commission + tax)
    const monthlyData = {};
    let totalCommission = 0;
    let totalTax = 0;
    let totalAdminEarnings = 0;
    let totalOrders = orders.length;
    let totalSales = 0;

    orders.forEach(order => {
      const month = new Date(order.deliveredAt || order.createdAt).toLocaleString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      const commission = order.earnings?.platformCommission || 0;
      const tax = order.earnings?.totalTax || 0;
      const adminEarning = commission + tax;
      const sales = order.pricing?.itemsTotal || 0;

      if (!monthlyData[month]) {
        monthlyData[month] = { 
          month, 
          commission: 0, 
          tax: 0,
          adminEarnings: 0,
          sales: 0,
          orders: 0 
        };
      }

      monthlyData[month].commission += commission;
      monthlyData[month].tax += tax;
      monthlyData[month].adminEarnings += adminEarning;
      monthlyData[month].sales += sales;
      monthlyData[month].orders += 1;

      totalCommission += commission;
      totalTax += tax;
      totalAdminEarnings += adminEarning;
      totalSales += sales;
    });

    const monthlyEarnings = Object.values(monthlyData).map(m => ({
      month: m.month,
      commission: Math.round(m.commission * 100) / 100,
      tax: Math.round(m.tax * 100) / 100,
      adminEarnings: Math.round(m.adminEarnings * 100) / 100,
      sales: Math.round(m.sales * 100) / 100,
      orders: m.orders
    }));

    // Calculate analytics
    const now = new Date();
    const thisMonth = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const thisMonthData = monthlyData[thisMonth] || { adminEarnings: 0 };
    const lastMonthData = monthlyData[lastMonth] || { adminEarnings: 0 };

    const thisMonthEarnings = thisMonthData.adminEarnings;
    const lastMonthEarnings = lastMonthData.adminEarnings;
    const growthRate = lastMonthEarnings > 0 
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : 0;
    const averageOrderCommission = totalOrders > 0 ? totalCommission / totalOrders : 0;

    // Get top sellers by commission generated
    const sellerCommissions = {};
    orders.forEach(order => {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          const sellerId = item.seller?._id?.toString() || 'unknown';
          if (!sellerCommissions[sellerId]) {
            sellerCommissions[sellerId] = { 
              sellerId, 
              shopName: item.seller?.shopName || item.seller?.businessName || 'Unknown',
              commission: 0,
              tax: 0,
              totalAdminEarning: 0,
              orders: 0 
            };
          }
          const commission = order.earnings?.platformCommission || 0;
          const tax = order.earnings?.totalTax || 0;
          sellerCommissions[sellerId].commission += commission;
          sellerCommissions[sellerId].tax += tax;
          sellerCommissions[sellerId].totalAdminEarning += (commission + tax);
          sellerCommissions[sellerId].orders += 1;
        }
      }
    });

    const topSellers = Object.values(sellerCommissions)
      .sort((a, b) => b.totalAdminEarning - a.totalAdminEarning)
      .slice(0, 10)
      .map(s => ({
        sellerId: s.sellerId,
        shopName: s.shopName,
        commission: Math.round(s.commission * 100) / 100,
        tax: Math.round(s.tax * 100) / 100,
        totalAdminEarning: Math.round(s.totalAdminEarning * 100) / 100,
        orders: s.orders
      }));

    sendSuccess(res, 200, 'Admin earnings retrieved successfully', {
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalAdminEarnings: Math.round(totalAdminEarnings * 100) / 100,
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      monthlyEarnings,
      analytics: {
        thisMonth: Math.round(thisMonthEarnings * 100) / 100,
        lastMonth: Math.round(lastMonthEarnings * 100) / 100,
        growthRate: growthRate.toFixed(2),
        averageOrderCommission: averageOrderCommission.toFixed(2)
      },
      topSellers,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error(`Get admin earnings error: ${error.message}`);
    sendError(res, 500, 'Error retrieving admin earnings');
  }
};

/**
 * Get all pending payouts (admin view)
 * @route GET /api/v1/admin/payouts/pending
 * @access Private/Admin
 */
exports.getAllPendingPayouts = async (req, res) => {
  try {
    const { page = 1, limit = 20, sellerId } = req.query;
    const skip = (page - 1) * limit;

    // Build query - admin can filter by seller or see all
    const query = {
      status: 'delivered',
      'payout.status': 'upcoming',
      'earnings.netSellerEarning': { $gt: 0 }
    };

    if (sellerId) {
      query['items.seller'] = sellerId;
    }

    // Get orders with upcoming payout status
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .populate('items.seller', 'shopName businessDetails')
      .populate('items.product', 'name images')
      .sort({ deliveredAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Order.countDocuments(query);

    // Calculate total upcoming payout per seller
    const sellerPayouts = {};
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const sellerId = item.seller?._id?.toString();
          if (sellerId) {
            if (!sellerPayouts[sellerId]) {
              sellerPayouts[sellerId] = {
                sellerId,
                shopName: item.seller?.shopName || item.seller?.businessDetails?.businessName || 'Unknown',
                totalAmount: 0,
                orderCount: 0
              };
            }
            sellerPayouts[sellerId].totalAmount += (order.earnings?.netSellerEarning || 0);
            sellerPayouts[sellerId].orderCount += 1;
          }
        });
      }
    });

    const totalAmount = orders.reduce((sum, order) => sum + (order.earnings?.netSellerEarning || 0), 0);

    logger.info(`Admin fetched pending payouts: ${orders.length} orders`);

    sendSuccess(res, 200, 'Pending payouts fetched successfully', { 
      orders,
      sellerPayouts: Object.values(sellerPayouts),
      totalAmount: Math.round(totalAmount * 100) / 100,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error(`Get admin pending payouts error: ${error.message}`);
    sendError(res, 500, 'Error fetching pending payouts');
  }
};

/**
 * Get all payout history (admin view)
 * @route GET /api/v1/admin/payouts/history
 * @access Private/Admin
 */
exports.getAllPayoutHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, sellerId } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (sellerId) query.seller = sellerId;

    const transactions = await PayoutTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('seller', 'shopName businessDetails bankDetails')
      .populate('orders', 'orderId pricing.itemsTotal earnings.netSellerEarning deliveredAt')
      .lean();

    const total = await PayoutTransaction.countDocuments(query);

    // Calculate stats
    const stats = {
      totalPaid: await PayoutTransaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(r => r[0]?.total || 0),
      totalPending: await PayoutTransaction.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(r => r[0]?.total || 0),
      totalProcessing: await PayoutTransaction.aggregate([
        { $match: { status: 'processing' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]).then(r => r[0]?.total || 0),
      completedCount: await PayoutTransaction.countDocuments({ status: 'completed' }),
      pendingCount: await PayoutTransaction.countDocuments({ status: 'pending' }),
      processingCount: await PayoutTransaction.countDocuments({ status: 'processing' })
    };

    logger.info(`Admin fetched payout history: ${transactions.length} transactions`);

    sendSuccess(res, 200, 'Payout history fetched successfully', { 
      transactions,
      stats,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error(`Get admin payout history error: ${error.message}`);
    sendError(res, 500, 'Error fetching payout history');
  }
};

/**
 * Get wallet details (admin view - all sellers or specific seller)
 * @route GET /api/v1/admin/wallet
 * @access Private/Admin
 */
exports.getAllWallets = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (sellerId) {
      // Get specific seller wallet
      const seller = await Seller.findById(sellerId).select('shopName businessDetails wallet');
      if (!seller) {
        return sendError(res, 404, 'Seller not found');
      }

      sendSuccess(res, 200, 'Wallet details fetched successfully', {
        seller: {
          _id: seller._id,
          shopName: seller.shopName || seller.businessDetails?.businessName,
          wallet: seller.wallet
        }
      });
    } else {
      // Get all sellers with wallet summary
      const sellers = await Seller.find()
        .select('shopName businessDetails wallet')
        .sort({ 'wallet.available': -1 })
        .lean();

      const summary = {
        totalAvailable: sellers.reduce((sum, s) => sum + (s.wallet?.available || 0), 0),
        totalPending: sellers.reduce((sum, s) => sum + (s.wallet?.pending || 0), 0),
        totalEarnings: sellers.reduce((sum, s) => sum + (s.wallet?.totalEarnings || 0), 0),
        totalWithdrawn: sellers.reduce((sum, s) => sum + (s.wallet?.totalWithdrawn || 0), 0),
        sellerCount: sellers.length
      };

      sendSuccess(res, 200, 'All wallets fetched successfully', {
        sellers: sellers.map(s => ({
          _id: s._id,
          shopName: s.shopName || s.businessDetails?.businessName,
          wallet: s.wallet
        })),
        summary
      });
    }
  } catch (error) {
    logger.error(`Get admin wallets error: ${error.message}`);
    sendError(res, 500, 'Error fetching wallet details');
  }
};