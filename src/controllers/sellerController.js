/**
 * @fileoverview Seller controller
 * @module controllers/sellerController
 */

const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SellerWallet = require('../models/SellerWallet');
const PayoutTransaction = require('../models/PayoutTransaction');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { uploadToCloudinary, uploadMultipleToCloudinary } = require('../config/cloudinary');
const fs = require('fs');

/**
 * Get seller dashboard stats
 * @route GET /api/v1/sellers/dashboard
 * @access Private/Seller
 */
exports.getDashboard = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    // Get recent orders
    const recentOrders = await Order.find({ 'items.seller': seller._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .lean();

    // Calculate stats
    const totalProducts = await Product.countDocuments({ seller: seller._id });
    const totalOrders = await Order.countDocuments({ 'items.seller': seller._id });
    const pendingOrders = await Order.countDocuments({ 
      'items.seller': seller._id,
      status: { $in: ['pending', 'confirmed', 'processing'] }
    });
    const pendingReturns = await Order.countDocuments({ 
      'items.seller': seller._id,
      status: 'return_requested'
    });
    
    // Calculate total revenue from completed orders
    const revenueData = await Order.aggregate([
      { $match: { 'items.seller': seller._id, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$pricing.total' } } }
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    sendSuccess(res, 200, 'Dashboard data retrieved successfully', {
      seller,
      stats: {
        totalProducts,
        totalOrders,
        pendingOrders,
        pendingReturns,
        totalRevenue
      },
      recentOrders
    });
  } catch (error) {
    logger.error(`Get dashboard error: ${error.message}`);
    sendError(res, 500, 'Error retrieving dashboard data');
  }
};

/**
 * Get seller profile
 * @route GET /api/v1/sellers/profile
 * @access Private/Seller
 */
exports.getProfile = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id }).populate('user', '-password');
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    sendSuccess(res, 200, 'Profile retrieved successfully', { seller });
  } catch (error) {
    logger.error(`Get seller profile error: ${error.message}`);
    sendError(res, 500, 'Error retrieving profile');
  }
};

/**
 * Create seller profile
 * @route POST /api/v1/sellers/profile
 * @access Private (Authenticated user)
 */
exports.createProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Check if seller already exists
    const existingSeller = await Seller.findOne({ user: userId });
    
    const { 
      shopName, 
      businessType, 
      gstNumber, 
      enrollmentId,
      panNumber, 
      address,
      businessAddress, 
      bankDetails,
      kycDocuments,
      description,
      categories 
    } = req.body;

    // Check if shop name is unique (excluding current seller's shop name)
    if (shopName) {
      const existingShop = await Seller.findOne({ 
        shopName: shopName,
        _id: { $ne: existingSeller?._id } // Exclude current seller
      });
      if (existingShop) {
        return sendError(res, 400, 'This store name is already taken. Please choose a different name.');
      }
    }

    // If seller exists, update the profile
    if (existingSeller) {
      const updateData = {};
      
      if (shopName) updateData.shopName = shopName;
      if (businessType) updateData.businessType = businessType;
      if (description) updateData.description = description;
      if (businessAddress || address) updateData.businessAddress = businessAddress || address;
      if (bankDetails) updateData.bankDetails = bankDetails;
      if (kycDocuments) updateData.kycDocuments = kycDocuments;
      if (categories) updateData.categories = categories;
      
      const updatedSeller = await Seller.findByIdAndUpdate(
        existingSeller._id,
        updateData,
        { new: true, runValidators: true }
      );
      
      logger.info(`Seller profile updated for user: ${userId}`);
      return sendSuccess(res, 200, 'Seller profile updated successfully', { 
        seller: updatedSeller,
        sellerId: updatedSeller._id 
      });
    }

    // Use businessAddress if provided, otherwise use address
    const sellerAddress = businessAddress || address || {
      addressLine1: 'Address',
      city: 'City',
      state: 'State',
      pincode: '000000'
    };

    // Create new seller profile
    const seller = await Seller.create({
      user: userId,
      shopName: shopName || 'My Store',
      businessType: businessType || 'individual',
      description: description || '',
      businessAddress: sellerAddress,
      kycDocuments: kycDocuments || {},
      bankDetails: bankDetails || {},
      categories: categories || [],
      isVerified: false,
      kycStatus: 'pending'
    });

    // Update user role to seller
    const User = require('../models/User');
    await User.findByIdAndUpdate(userId, { role: 'seller' });

    logger.info(`Seller profile created for user: ${userId}`);

    sendSuccess(res, 201, 'Seller profile created successfully', { 
      seller,
      sellerId: seller._id 
    });
  } catch (error) {
    logger.error(`Create seller profile error: ${error.message}`);
    sendError(res, 500, 'Error creating seller profile', error.message);
  }
};

/**
 * Update seller profile
 * @route PUT /api/v1/sellers/profile
 * @access Private/Seller
 */
exports.updateProfile = async (req, res) => {
  try {
    const { shopName, description, businessAddress, categories } = req.body;

    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    const updateData = {};
    
    // Check if shopName is being changed and if it's unique
    if (shopName && shopName !== seller.shopName) {
      const existingShop = await Seller.findOne({ shopName: shopName });
      if (existingShop) {
        return sendError(res, 400, 'Store name already taken. Please choose a different name.');
      }
      updateData.shopName = shopName;
    } else if (shopName) {
      updateData.shopName = shopName;
    }
    
    if (description) updateData.description = description;
    if (businessAddress) updateData.businessAddress = businessAddress;
    if (categories) updateData.categories = categories;

    // Handle shop logo upload
    if (req.file) {
      const result = await uploadToCloudinary(req.file.path, 'meesho/sellers');
      updateData.shopLogo = {
        public_id: result.public_id,
        url: result.secure_url
      };
      fs.unlinkSync(req.file.path);
    }

    Object.assign(seller, updateData);
    await seller.save();

    sendSuccess(res, 200, 'Profile updated successfully', { seller });
  } catch (error) {
    logger.error(`Update seller profile error: ${error.message}`);
    sendError(res, 500, 'Error updating profile');
  }
};

/**
 * Submit KYC documents
 * @route POST /api/v1/sellers/kyc
 * @access Private/Seller
 */
exports.submitKYC = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    const { aadharNumber, panNumber, gstNumber } = req.body;
    const kycData = {};

    // Upload documents
    if (req.files) {
      if (req.files.aadharFront) {
        const result = await uploadToCloudinary(req.files.aadharFront[0].path, 'meesho/kyc');
        kycData['kycDocuments.aadharCard.front'] = {
          public_id: result.public_id,
          url: result.secure_url
        };
        kycData['kycDocuments.aadharCard.number'] = aadharNumber;
        fs.unlinkSync(req.files.aadharFront[0].path);
      }

      if (req.files.panCard) {
        const result = await uploadToCloudinary(req.files.panCard[0].path, 'meesho/kyc');
        kycData['kycDocuments.panCard.image'] = {
          public_id: result.public_id,
          url: result.secure_url
        };
        kycData['kycDocuments.panCard.number'] = panNumber;
        fs.unlinkSync(req.files.panCard[0].path);
      }
    }

    seller.kycStatus = 'submitted';
    Object.assign(seller, kycData);
    await seller.save();

    sendSuccess(res, 200, 'KYC documents submitted successfully', { seller });
  } catch (error) {
    logger.error(`Submit KYC error: ${error.message}`);
    sendError(res, 500, 'Error submitting KYC documents');
  }
};

/**
 * Add bank details
 * @route POST /api/v1/sellers/bank-details
 * @access Private/Seller
 */
exports.addBankDetails = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    seller.bankDetails = req.body;
    await seller.save();

    sendSuccess(res, 200, 'Bank details added successfully', { seller });
  } catch (error) {
    logger.error(`Add bank details error: ${error.message}`);
    sendError(res, 500, 'Error adding bank details');
  }
};

/**
 * Get seller products
 * @route GET /api/v1/sellers/products
 * @access Private/Seller
 */
exports.getProducts = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    const { page = 1, limit = 20, status } = req.query;

    const query = { seller: seller._id };
    if (status) query.isActive = status === 'active';

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    sendSuccess(res, 200, 'Products retrieved successfully', {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Get seller products error: ${error.message}`);
    sendError(res, 500, 'Error retrieving products');
  }
};

/**
 * Update product
 * @route PUT /api/v1/sellers/products/:id
 * @access Private/Seller
 */
exports.updateProduct = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    const product = await Product.findOne({ 
      _id: req.params.id, 
      seller: seller._id 
    });

    if (!product) {
      return sendError(res, 404, 'Product not found');
    }

    // Update product fields
    const allowedUpdates = ['stock', 'price', 'discount', 'isActive'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    Object.assign(product, updates);
    await product.save();

    sendSuccess(res, 200, 'Product updated successfully', { product });
  } catch (error) {
    logger.error(`Update product error: ${error.message}`);
    sendError(res, 500, 'Error updating product');
  }
};

/**
 * Get seller orders
 * @route GET /api/v1/sellers/orders
 * @access Private/Seller
 */
exports.getOrders = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    const { page = 1, limit = 20, status } = req.query;

    const query = { 'items.seller': seller._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images price')
      .lean();

    const total = await Order.countDocuments(query);

    sendSuccess(res, 200, 'Orders retrieved successfully', {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Get seller orders error: ${error.message}`);
    sendError(res, 500, 'Error retrieving orders');
  }
};

/**
 * Update order status
 * @route PUT /api/v1/sellers/orders/:orderId/status
 * @access Private/Seller
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, trackingId, courier } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    order.status = status;
    if (status === 'shipped') {
      order.shippedAt = Date.now();
      if (trackingId) order.tracking.trackingId = trackingId;
      if (courier) order.tracking.courier = courier;
    } else if (status === 'delivered') {
      order.deliveredAt = Date.now();
      order.payment.status = 'completed';
      
      // Calculate seller earnings when order is delivered
      try {
        await order.calculateSellerEarnings();
        await order.save();
        
        // Update seller wallet
        const SellerWallet = require('../models/SellerWallet');
        const wallet = await SellerWallet.getOrCreate(seller._id);
        await wallet.updateFromOrders();
        
        logger.info(`✅ Earnings calculated for order ${order.orderId}: ₹${order.earnings?.netSellerEarning}`);
      } catch (earningError) {
        logger.error(`❌ Error calculating earnings for order ${order.orderId}: ${earningError.message}`);
        // Don't fail the delivery update if earnings calculation fails
      }
    }

    await order.save();

    sendSuccess(res, 200, 'Order status updated successfully', { order });
  } catch (error) {
    logger.error(`Update order status error: ${error.message}`);
    sendError(res, 500, 'Error updating order status');
  }
};

/**
 * Get seller returns
 * @route GET /api/v1/sellers/returns
 * @access Private/Seller
 */
exports.getReturns = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    console.log('🔍 Seller ID:', seller._id);
    const { page = 1, limit = 15, status, search } = req.query;

    // Query orders with return_requested or return statuses
    const query = { 
      'items.seller': seller._id,
      status: { $in: ['return_requested', 'return_approved', 'return_rejected', 'returned'] }
    };
    
    console.log('🔍 Query for returns:', JSON.stringify(query));
    
    if (status && status !== 'all') {
      // Map frontend status to backend status
      if (status === 'pending') {
        query.status = 'return_requested';
      } else if (status === 'approved') {
        query.status = 'return_approved';
      } else if (status === 'rejected') {
        query.status = 'return_rejected';
      } else if (status === 'refunded') {
        query.status = 'returned';
      } else {
        query.status = status;
      }
    }

    const returns = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('user', 'name email phone')
      .populate('items.product', 'name images price')
      .lean();

    console.log('📦 Returns found:', returns.length);
    
    const total = await Order.countDocuments(query);

    // Calculate stats
    const stats = {
      pending: await Order.countDocuments({ 'items.seller': seller._id, status: 'return_requested' }),
      approved: await Order.countDocuments({ 'items.seller': seller._id, status: 'return_approved' }),
      rejected: await Order.countDocuments({ 'items.seller': seller._id, status: 'return_rejected' }),
      totalRefunded: 0
    };

    console.log('📊 Stats:', stats);

    // Calculate total refunded amount
    const refundedOrders = await Order.find({ 
      'items.seller': seller._id, 
      status: 'returned' 
    }).select('pricing.total');
    stats.totalRefunded = refundedOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

    // Transform returns
    const formattedReturns = returns.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      customer: order.user,
      items: order.items,
      status: order.status,
      reason: order.returnReason || order.returnRequest?.reason || 'Not specified',
      totalAmount: order.pricing?.total || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      returnRequest: order.returnRequest
    }));

    sendSuccess(res, 200, 'Returns retrieved successfully', {
      returns: formattedReturns,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Get seller returns error: ${error.message}`);
    sendError(res, 500, 'Error retrieving returns');
  }
};

/**
 * Update return status
 * @route PUT /api/v1/sellers/returns/:orderId
 * @access Private/Seller
 */
exports.updateReturnStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['return_approved', 'return_rejected', 'returned'];
    if (!validStatuses.includes(status)) {
      return sendError(res, 400, 'Invalid return status. Use return_approved, return_rejected, or returned');
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return sendError(res, 404, 'Order not found');
    }

    // Verify seller owns this order
    const seller = await Seller.findOne({ user: req.user._id });
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    // Check if seller owns at least one item in the order
    const sellerOwnsItem = order.items.some(item => 
      item.seller.toString() === seller._id.toString()
    );

    if (!sellerOwnsItem) {
      return sendError(res, 403, 'Not authorized to update this return');
    }

    // Update order status and return request
    order.status = status;
    if (notes) order.returnNotes = notes;

    if (status === 'return_approved') {
      order.returnRequest.status = 'approved';
      order.returnRequest.approvedAt = new Date();
    } else if (status === 'return_rejected') {
      order.returnRequest.status = 'rejected';
      order.returnRequest.rejectedAt = new Date();
      order.returnRequest.rejectionReason = notes;
    } else if (status === 'returned') {
      order.returnRequest.status = 'completed';
      order.returnRequest.completedAt = new Date();
      order.payment.status = 'refunded';
    }

    await order.save();

    logger.info(`Return status updated to ${status} for order ${order.orderId} by seller ${seller._id}`);

    sendSuccess(res, 200, 'Return status updated successfully', { order });
  } catch (error) {
    logger.error(`Update return status error: ${error.message}`);
    sendError(res, 500, 'Error updating return status');
  }
};

/**
 * Get seller wallet details
 * @route GET /api/v1/sellers/wallet
 * @access Private/Seller
 */
exports.getWallet = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    // Get or create wallet
    let wallet = await SellerWallet.getOrCreate(seller._id);
    
    // Update wallet from orders
    await wallet.updateFromOrders();
    
    // Reload wallet with updated values
    wallet = await SellerWallet.findOne({ seller: seller._id });

    logger.info(`Wallet fetched for seller ${seller._id}`);

    sendSuccess(res, 200, 'Wallet fetched successfully', { wallet });
  } catch (error) {
    logger.error(`Get wallet error: ${error.message}`);
    sendError(res, 500, 'Error fetching wallet details');
  }
};

/**
 * Get pending payouts (orders ready for payout)
 * @route GET /api/v1/sellers/payouts/pending
 * @access Private/Seller
 */
exports.getPendingPayouts = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    // Get orders with upcoming payout status
    const orders = await Order.find({
      'items.seller': seller._id,
      status: 'delivered',
      'payout.status': 'upcoming',
      'earnings.netSellerEarning': { $gt: 0 }
    })
    .populate('user', 'name email phone')
    .populate('items.product', 'name images')
    .sort({ deliveredAt: -1 })
    .lean();

    // Calculate total upcoming payout
    const totalAmount = orders.reduce((sum, order) => sum + (order.earnings?.netSellerEarning || 0), 0);

    logger.info(`Pending payouts fetched for seller ${seller._id}: ${orders.length} orders`);

    sendSuccess(res, 200, 'Pending payouts fetched successfully', { 
      orders,
      totalAmount: Math.round(totalAmount * 100) / 100,
      count: orders.length
    });
  } catch (error) {
    logger.error(`Get pending payouts error: ${error.message}`);
    sendError(res, 500, 'Error fetching pending payouts');
  }
};

/**
 * Get payout history
 * @route GET /api/v1/sellers/payouts/history
 * @access Private/Seller
 */
exports.getPayoutHistory = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { seller: seller._id };
    if (status) query.status = status;

    const transactions = await PayoutTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('orders', 'orderId pricing.itemsTotal earnings.netSellerEarning deliveredAt')
      .lean();

    const total = await PayoutTransaction.countDocuments(query);

    logger.info(`Payout history fetched for seller ${seller._id}: ${transactions.length} transactions`);

    sendSuccess(res, 200, 'Payout history fetched successfully', { 
      transactions,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error(`Get payout history error: ${error.message}`);
    sendError(res, 500, 'Error fetching payout history');
  }
};

/**
 * Request payout (seller initiates withdrawal)
 * @route POST /api/v1/sellers/payouts/request
 * @access Private/Seller
 */
exports.requestPayout = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    const { orderIds, paymentMode = 'bank' } = req.body;

    // Validate bank details
    if (!seller.bankDetails || !seller.bankDetails.accountNumber) {
      return sendError(res, 400, 'Please add bank details before requesting payout');
    }

    // Get orders ready for payout
    const orders = await Order.find({
      _id: { $in: orderIds },
      'items.seller': seller._id,
      status: 'delivered',
      'payout.status': 'upcoming',
      'earnings.netSellerEarning': { $gt: 0 }
    });

    if (orders.length === 0) {
      return sendError(res, 400, 'No eligible orders for payout');
    }

    // Create payout transaction
    const payout = new PayoutTransaction({
      seller: seller._id,
      orders: orders.map(o => o._id),
      paymentMode,
      paymentDetails: {
        accountNumber: seller.bankDetails.accountNumber,
        ifscCode: seller.bankDetails.ifscCode,
        accountHolderName: seller.bankDetails.accountHolderName,
        bankName: seller.bankDetails.bankName,
        upiId: seller.bankDetails.upiId
      },
      status: 'pending'
    });

    // Calculate breakdown
    await payout.calculateBreakdown();
    await payout.save();

    // Update order payout status
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: { 'payout.status': 'processing' } }
    );

    logger.info(`Payout requested by seller ${seller._id}: ${payout.transactionId}, Amount: ₹${payout.amount}`);

    sendSuccess(res, 201, 'Payout request submitted successfully', { payout });
  } catch (error) {
    logger.error(`Request payout error: ${error.message}`);
    sendError(res, 500, 'Error processing payout request');
  }
};

/**
 * Get earnings breakdown
 * @route GET /api/v1/sellers/earnings/breakdown
 * @access Private/Seller
 */
exports.getEarningsBreakdown = async (req, res) => {
  try {
    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    const { startDate, endDate } = req.query;
    
    const query = {
      'items.seller': seller._id,
      status: 'delivered',
      'earnings.netSellerEarning': { $gt: 0 }
    };

    if (startDate && endDate) {
      query.deliveredAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orders = await Order.find(query)
      .populate('items.product', 'name category')
      .lean();

    // Calculate breakdown
    let totalSales = 0;
    let totalCommission = 0;
    let totalTax = 0;
    let totalShipping = 0;
    let totalPenalty = 0;
    let netEarnings = 0;

    orders.forEach(order => {
      if (order.earnings) {
        totalSales += order.pricing.itemsTotal;
        totalCommission += order.earnings.platformCommission || 0;
        totalTax += order.earnings.totalTax || 0;
        totalShipping += order.earnings.shippingCharges || 0;
        totalPenalty += order.earnings.penalty || 0;
        netEarnings += order.earnings.netSellerEarning || 0;
      }
    });

    const breakdown = {
      totalOrders: orders.length,
      totalSales: Math.round(totalSales * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalShipping: Math.round(totalShipping * 100) / 100,
      totalPenalty: Math.round(totalPenalty * 100) / 100,
      netEarnings: Math.round(netEarnings * 100) / 100,
      averageCommissionPercent: orders.length > 0 ? 
        (orders.reduce((sum, o) => sum + (o.earnings?.commissionPercent || 0), 0) / orders.length).toFixed(2) : 0
    };

    logger.info(`Earnings breakdown fetched for seller ${seller._id}`);

    sendSuccess(res, 200, 'Earnings breakdown fetched successfully', { breakdown, orders });
  } catch (error) {
    logger.error(`Get earnings breakdown error: ${error.message}`);
    sendError(res, 500, 'Error fetching earnings breakdown');
  }
};

