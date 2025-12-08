/**
 * @fileoverview Cart controller for cart operations
 * @module controllers/cartController
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Get user cart
 * @route   GET /api/v1/cart/my
 * @access  Private
 */
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'name images price mrp discount stock seller',
        populate: {
          path: 'seller',
          select: 'businessName'
        }
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    logger.error('Error fetching cart:', error);
    next(error);
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/v1/cart/add
 * @access  Private
 */
exports.addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, size = 'Free Size', color = '' } = req.body;

    // Validate product exists and has stock
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (product.stock.quantity < quantity) {
      return next(new AppError('Insufficient stock', 400));
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && 
              item.size === size && 
              item.color === color
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
        size,
        color
      });
    }

    await cart.save();

    // Populate and return
    await cart.populate({
      path: 'items.product',
      select: 'name images price mrp discount stock seller',
      populate: {
        path: 'seller',
        select: 'businessName'
      }
    });

    logger.info(`Item added to cart by user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    logger.error('Error adding to cart:', error);
    next(error);
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/v1/cart/update
 * @access  Private
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity, size = 'Free Size', color = '' } = req.body;

    if (quantity < 0) {
      return next(new AppError('Quantity cannot be negative', 400));
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && 
              item.size === size && 
              item.color === color
    );

    if (itemIndex === -1) {
      return next(new AppError('Item not found in cart', 404));
    }

    if (quantity === 0) {
      // Remove item
      cart.items.splice(itemIndex, 1);
    } else {
      // Check stock
      const product = await Product.findById(productId);
      if (product.stock.quantity < quantity) {
        return next(new AppError('Insufficient stock', 400));
      }
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name images price mrp discount stock seller',
      populate: {
        path: 'seller',
        select: 'businessName'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    logger.error('Error updating cart:', error);
    next(error);
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/v1/cart/remove/:productId
 * @access  Private
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { size = 'Free Size', color = '' } = req.query;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = cart.items.filter(
      item => !(item.product.toString() === productId && 
                item.size === size && 
                item.color === color)
    );

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'name images price mrp discount stock seller',
      populate: {
        path: 'seller',
        select: 'businessName'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    logger.error('Error removing from cart:', error);
    next(error);
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/v1/cart/clear
 * @access  Private
 */
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return next(new AppError('Cart not found', 404));
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    logger.error('Error clearing cart:', error);
    next(error);
  }
};
