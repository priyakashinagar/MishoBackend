/**
 * @fileoverview Earnings controller for sellers
 * @module controllers/earningsController
 */

const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Get seller earnings summary
 * @route GET /api/v1/earnings/summary
 * @access Private (Seller only)
 */
exports.getEarningsSummary = async (req, res) => {
  try {
    const sellerId = req.user.sellerId || req.user._id;

    // Get all completed orders for this seller
    const orders = await Order.find({
      'items.seller': sellerId,
      status: { $in: ['delivered', 'completed'] }
    });

    // Calculate earnings by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = {};
    let totalEarnings = 0;
    let totalOrders = 0;

    orders.forEach(order => {
      if (new Date(order.createdAt) >= sixMonthsAgo) {
        const month = new Date(order.createdAt).toLocaleString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        });

        // Calculate seller's earnings from this order
        const sellerItems = order.items.filter(
          item => item.seller.toString() === sellerId.toString()
        );
        const orderEarnings = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        if (!monthlyEarnings[month]) {
          monthlyEarnings[month] = {
            month,
            amount: 0,
            orders: 0
          };
        }

        monthlyEarnings[month].amount += orderEarnings;
        monthlyEarnings[month].orders += 1;
        totalEarnings += orderEarnings;
        totalOrders += 1;
      }
    });

    // Convert to array and sort by date
    const earningsArray = Object.values(monthlyEarnings).sort((a, b) => {
      return new Date(b.month) - new Date(a.month);
    });

    sendSuccess(res, 200, 'Earnings retrieved successfully', {
      totalEarnings,
      totalOrders,
      monthlyEarnings: earningsArray,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    sendError(res, 500, 'Failed to fetch earnings');
  }
};

/**
 * Get detailed earnings breakdown
 * @route GET /api/v1/earnings/detailed
 * @access Private (Seller only)
 */
exports.getDetailedEarnings = async (req, res) => {
  try {
    const sellerId = req.user.sellerId || req.user._id;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {
      'items.seller': sellerId,
      status: { $in: ['delivered', 'completed'] }
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('user', 'name email')
      .populate('items.product', 'name');

    const total = await Order.countDocuments(query);

    const earningsData = orders.map(order => {
      const sellerItems = order.items.filter(
        item => item.seller.toString() === sellerId.toString()
      );
      const earnings = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return {
        orderId: order.orderId,
        date: order.createdAt,
        customer: order.user?.name || 'N/A',
        products: sellerItems.map(item => item.product?.name || 'N/A'),
        amount: earnings,
        status: order.status
      };
    });

    sendSuccess(res, 200, 'Detailed earnings retrieved successfully', {
      earnings: earningsData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching detailed earnings:', error);
    sendError(res, 500, 'Failed to fetch detailed earnings');
  }
};

/**
 * Get earnings analytics
 * @route GET /api/v1/earnings/analytics
 * @access Private (Seller only)
 */
exports.getEarningsAnalytics = async (req, res) => {
  try {
    const sellerId = req.user.sellerId || req.user._id;

    const orders = await Order.find({
      'items.seller': sellerId,
      status: { $in: ['delivered', 'completed'] }
    });

    // Calculate various metrics
    const today = new Date();
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    let thisMonthEarnings = 0;
    let lastMonthEarnings = 0;
    let averageOrderValue = 0;

    orders.forEach(order => {
      const sellerItems = order.items.filter(
        item => item.seller.toString() === sellerId.toString()
      );
      const orderEarnings = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      if (new Date(order.createdAt) >= thisMonthStart) {
        thisMonthEarnings += orderEarnings;
      }

      if (new Date(order.createdAt) >= lastMonthStart && new Date(order.createdAt) <= lastMonthEnd) {
        lastMonthEarnings += orderEarnings;
      }

      averageOrderValue += orderEarnings;
    });

    averageOrderValue = orders.length > 0 ? averageOrderValue / orders.length : 0;

    const growthRate = lastMonthEarnings > 0 
      ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 
      : 0;

    sendSuccess(res, 200, 'Analytics retrieved successfully', {
      thisMonth: thisMonthEarnings,
      lastMonth: lastMonthEarnings,
      growthRate: growthRate.toFixed(2),
      averageOrderValue: averageOrderValue.toFixed(2),
      totalOrders: orders.length
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    sendError(res, 500, 'Failed to fetch analytics');
  }
};
