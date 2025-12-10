/**
 * @fileoverview Payment Controller
 */

const Payment = require('../models/Payment');

exports.getAllPayments = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;
    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { sellerId };
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    const payments = await Payment.find(query)
      .populate('orderId', 'orderNumber totalAmount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    const stats = {
      totalEarnings: await Payment.aggregate([
        { $match: { sellerId: sellerId, type: 'sale', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]).then(r => r[0]?.total || 0),
      pendingAmount: await Payment.aggregate([
        { $match: { sellerId: sellerId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$netAmount' } } }
      ]).then(r => r[0]?.total || 0),
      completedCount: await Payment.countDocuments({ sellerId, status: 'completed' }),
    };

    res.status(200).json({
      success: true,
      data: { payments, stats, pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      }},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments', error: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('orderId');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment', error: error.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.body.sellerId;
    const payment = await Payment.create({ ...req.body, sellerId });
    res.status(201).json({ success: true, message: 'Payment created successfully', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create payment', error: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status, actualSettlementDate: status === 'completed' ? new Date() : undefined },
      { new: true }
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.status(200).json({ success: true, message: 'Payment status updated', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update payment', error: error.message });
  }
};
