/**
 * @fileoverview Quality Controller
 */

const Quality = require('../models/Quality');

exports.getQualityMetrics = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;
    const metrics = await Quality.find({ sellerId }).populate('productId', 'name images');
    
    const stats = {
      averageScore: metrics.reduce((sum, m) => sum + m.score, 0) / (metrics.length || 1),
      excellentProducts: metrics.filter(m => m.status === 'excellent').length,
      poorProducts: metrics.filter(m => m.status === 'poor').length,
    };

    res.status(200).json({ success: true, data: { metrics, stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quality metrics', error: error.message });
  }
};

exports.getQualityById = async (req, res) => {
  try {
    const quality = await Quality.findById(req.params.id).populate('productId');
    if (!quality) return res.status(404).json({ success: false, message: 'Quality metrics not found' });
    res.status(200).json({ success: true, data: quality });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quality metrics', error: error.message });
  }
};

exports.updateQualityMetrics = async (req, res) => {
  try {
    const quality = await Quality.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!quality) return res.status(404).json({ success: false, message: 'Quality metrics not found' });
    res.status(200).json({ success: true, message: 'Quality metrics updated', data: quality });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update quality metrics', error: error.message });
  }
};
