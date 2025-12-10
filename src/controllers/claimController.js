/**
 * @fileoverview Claim Controller
 */

const Claim = require('../models/Claim');

exports.getAllClaims = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;
    const { status, type, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { sellerId };
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    const claims = await Claim.find(query)
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Claim.countDocuments(query);
    const stats = {
      total,
      submitted: await Claim.countDocuments({ sellerId, status: 'submitted' }),
      approved: await Claim.countDocuments({ sellerId, status: 'approved' }),
      rejected: await Claim.countDocuments({ sellerId, status: 'rejected' }),
    };

    res.status(200).json({
      success: true,
      data: { claims, stats, pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      }},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch claims', error: error.message });
  }
};

exports.getClaimById = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id).populate('orderId').populate('timeline.updatedBy', 'name');
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });
    res.status(200).json({ success: true, data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch claim', error: error.message });
  }
};

exports.createClaim = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.body.sellerId;
    const claimNumber = 'CLM' + Date.now();
    const claim = await Claim.create({ ...req.body, sellerId, claimNumber });
    res.status(201).json({ success: true, message: 'Claim submitted successfully', data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create claim', error: error.message });
  }
};

exports.updateClaimStatus = async (req, res) => {
  try {
    const { status, comment } = req.body;
    const claim = await Claim.findById(req.params.id);
    if (!claim) return res.status(404).json({ success: false, message: 'Claim not found' });

    claim.status = status;
    claim.timeline.push({ status, comment, updatedBy: req.user?._id });
    await claim.save();

    res.status(200).json({ success: true, message: 'Claim status updated', data: claim });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update claim', error: error.message });
  }
};
