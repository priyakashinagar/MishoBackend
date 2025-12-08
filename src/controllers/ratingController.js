/**
 * @fileoverview Rating controller for rating operations
 * @module controllers/ratingController
 */

const mongoose = require('mongoose');
const Rating = require('../models/Rating');
const Product = require('../models/Product');
const Order = require('../models/Order');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Get product ratings
 * @route   GET /api/v1/rating/:productId
 * @access  Public
 */
exports.getProductRatings = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

    // Get ratings
    const ratings = await Rating.find({ product: productId })
      .populate('user', 'name')
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Rating.countDocuments({ product: productId });

    // Calculate rating distribution
    const distribution = await Rating.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Calculate average
    const stats = await Rating.calculateAverageRating(productId);

    // Format distribution
    const ratingDistribution = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    distribution.forEach(item => {
      ratingDistribution[item._id] = item.count;
    });

    res.status(200).json({
      success: true,
      data: {
        ratings,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        stats: {
          average: stats.average,
          count: stats.count,
          distribution: ratingDistribution
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching ratings:', error);
    next(error);
  }
};

/**
 * @desc    Add rating
 * @route   POST /api/v1/rating/add
 * @access  Private
 */
exports.addRating = async (req, res, next) => {
  try {
    const { productId, rating, review, title } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Check if user already rated this product
    const existingRating = await Rating.findOne({
      user: req.user._id,
      product: productId
    });

    if (existingRating) {
      return next(new AppError('You have already rated this product', 400));
    }

    // Check if user has purchased this product (verified purchase)
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'items.product': productId,
      status: 'delivered'
    });

    // Create rating
    const newRating = await Rating.create({
      user: req.user._id,
      product: productId,
      rating,
      review,
      title,
      isVerifiedPurchase: !!hasPurchased
    });

    await newRating.populate('user', 'name');

    logger.info(`Rating added for product: ${productId} by user: ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Rating added successfully',
      data: newRating
    });
  } catch (error) {
    logger.error('Error adding rating:', error);
    next(error);
  }
};

/**
 * @desc    Update rating
 * @route   PUT /api/v1/rating/update/:ratingId
 * @access  Private
 */
exports.updateRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;
    const { rating, review, title } = req.body;

    const existingRating = await Rating.findById(ratingId);
    if (!existingRating) {
      return next(new AppError('Rating not found', 404));
    }

    // Check ownership
    if (existingRating.user.toString() !== req.user._id.toString()) {
      return next(new AppError('Not authorized to update this rating', 403));
    }

    existingRating.rating = rating || existingRating.rating;
    existingRating.review = review || existingRating.review;
    existingRating.title = title || existingRating.title;

    await existingRating.save();

    await existingRating.populate('user', 'name');

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: existingRating
    });
  } catch (error) {
    logger.error('Error updating rating:', error);
    next(error);
  }
};

/**
 * @desc    Delete rating
 * @route   DELETE /api/v1/rating/delete/:ratingId
 * @access  Private
 */
exports.deleteRating = async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return next(new AppError('Rating not found', 404));
    }

    // Check ownership or admin
    if (rating.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized to delete this rating', 403));
    }

    await rating.remove();

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting rating:', error);
    next(error);
  }
};

/**
 * @desc    Mark rating as helpful
 * @route   POST /api/v1/rating/helpful/:ratingId
 * @access  Private
 */
exports.markHelpful = async (req, res, next) => {
  try {
    const { ratingId } = req.params;

    const rating = await Rating.findByIdAndUpdate(
      ratingId,
      { $inc: { helpful: 1 } },
      { new: true }
    );

    if (!rating) {
      return next(new AppError('Rating not found', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Marked as helpful',
      helpful: rating.helpful
    });
  } catch (error) {
    logger.error('Error marking helpful:', error);
    next(error);
  }
};

/**
 * @desc    Get user's rating for a product
 * @route   GET /api/v1/rating/my/:productId
 * @access  Private
 */
exports.getMyRating = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const rating = await Rating.findOne({
      user: req.user._id,
      product: productId
    });

    res.status(200).json({
      success: true,
      data: rating
    });
  } catch (error) {
    logger.error('Error fetching user rating:', error);
    next(error);
  }
};
