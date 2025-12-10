/**
 * @fileoverview Pricing Controller
 */

const Pricing = require('../models/Pricing');

exports.getAllPricing = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;
    const pricing = await Pricing.find({ sellerId }).populate('productId', 'name images');
    res.status(200).json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pricing', error: error.message });
  }
};

exports.getPricingById = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id).populate('productId');
    if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' });
    res.status(200).json({ success: true, data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pricing', error: error.message });
  }
};

exports.createPricing = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.body.sellerId;
    const pricing = await Pricing.create({ ...req.body, sellerId });
    res.status(201).json({ success: true, message: 'Pricing created successfully', data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create pricing', error: error.message });
  }
};

exports.updatePricing = async (req, res) => {
  try {
    const pricing = await Pricing.findById(req.params.id);
    if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' });

    pricing.priceHistory.push({ price: pricing.sellingPrice, reason: req.body.reason || 'Manual update' });
    Object.assign(pricing, req.body);
    await pricing.save();

    res.status(200).json({ success: true, message: 'Pricing updated successfully', data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update pricing', error: error.message });
  }
};

exports.enableAutoPrice = async (req, res) => {
  try {
    const { enabled, strategy, minPrice, maxPrice } = req.body;
    const pricing = await Pricing.findByIdAndUpdate(
      req.params.id,
      { 'autoPrice.enabled': enabled, 'autoPrice.strategy': strategy, 'autoPrice.minPrice': minPrice, 'autoPrice.maxPrice': maxPrice },
      { new: true }
    );
    if (!pricing) return res.status(404).json({ success: false, message: 'Pricing not found' });
    res.status(200).json({ success: true, message: 'Auto-pricing updated', data: pricing });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update auto-pricing', error: error.message });
  }
};
