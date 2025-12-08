/**
 * @fileoverview Wishlist controller for wishlist operations
 * @module controllers/wishlistController
 */

const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Get user wishlist
 * @route   GET /api/v1/wishlist/my
 * @access  Private
 */
exports.getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'products.product',
        select: 'name images price mrp discount ratings stock'
      });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      data: wishlist
    });
  } catch (error) {
    logger.error('Error fetching wishlist:', error);
    next(error);
  }
};

/**
 * @desc    Add product to wishlist
 * @route   POST /api/v1/wishlist/add
 * @access  Private
 */
exports.addToWishlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    // Check if already in wishlist
    const exists = wishlist.products.find(
      item => item.product.toString() === productId
    );

    if (exists) {
      return res.status(200).json({
        success: true,
        message: 'Product already in wishlist',
        data: wishlist
      });
    }

    wishlist.products.push({ product: productId });
    await wishlist.save();

    await wishlist.populate({
      path: 'products.product',
      select: 'name images price mrp discount ratings stock'
    });

    logger.info(`Product added to wishlist by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      data: wishlist
    });
  } catch (error) {
    logger.error('Error adding to wishlist:', error);
    next(error);
  }
};

/**
 * @desc    Remove product from wishlist
 * @route   DELETE /api/v1/wishlist/remove/:productId
 * @access  Private
 */
exports.removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return next(new AppError('Wishlist not found', 404));
    }

    wishlist.products = wishlist.products.filter(
      item => item.product.toString() !== productId
    );

    await wishlist.save();

    await wishlist.populate({
      path: 'products.product',
      select: 'name images price mrp discount ratings stock'
    });

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      data: wishlist
    });
  } catch (error) {
    logger.error('Error removing from wishlist:', error);
    next(error);
  }
};

/**
 * @desc    Check if product is in wishlist
 * @route   GET /api/v1/wishlist/check/:productId
 * @access  Private
 */
exports.checkWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    
    const isInWishlist = wishlist ? 
      wishlist.products.some(item => item.product.toString() === productId) : 
      false;

    res.status(200).json({
      success: true,
      isInWishlist
    });
  } catch (error) {
    logger.error('Error checking wishlist:', error);
    next(error);
  }
};

/**
 * @desc    Move item from wishlist to cart
 * @route   POST /api/v1/wishlist/move-to-cart/:productId
 * @access  Private
 */
exports.moveToCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { size = 'Free Size', color = '' } = req.body;

    const Cart = require('../models/Cart');

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Add to cart
    const existingItem = cart.items.find(
      item => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.items.push({
        product: productId,
        quantity: 1,
        price: product.price,
        size,
        color
      });
    }

    await cart.save();

    // Remove from wishlist
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        item => item.product.toString() !== productId
      );
      await wishlist.save();
    }

    res.status(200).json({
      success: true,
      message: 'Product moved to cart'
    });
  } catch (error) {
    logger.error('Error moving to cart:', error);
    next(error);
  }
};
