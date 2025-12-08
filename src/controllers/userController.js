/**
 * @fileoverview User controller
 * @module controllers/userController
 */

const User = require('../models/User');
const Order = require('../models/Order');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');
const fs = require('fs');

/**
 * Get user profile
 * @route GET /api/v1/users/profile
 * @access Private
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    sendSuccess(res, 200, 'Profile retrieved successfully', { user });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    sendError(res, 500, 'Error retrieving profile');
  }
};

/**
 * Update user profile
 * @route PUT /api/v1/users/profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (preferences) updateData.preferences = preferences;

    // Handle profile picture upload
    if (req.file) {
      // Upload to cloudinary
      const result = await uploadToCloudinary(req.file.path, 'meesho/users');
      
      // Delete old image if exists
      if (req.user.avatar && req.user.avatar.public_id) {
        await deleteFromCloudinary(req.user.avatar.public_id);
      }

      updateData.avatar = {
        public_id: result.public_id,
        url: result.secure_url
      };

      // Delete local file
      fs.unlinkSync(req.file.path);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    sendSuccess(res, 200, 'Profile updated successfully', { user });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    sendError(res, 500, 'Error updating profile');
  }
};

/**
 * Add delivery address
 * @route POST /api/v1/users/addresses
 * @access Private
 */
exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    await user.addAddress(req.body);
    
    sendSuccess(res, 201, 'Address added successfully', { addresses: user.addresses });
  } catch (error) {
    logger.error(`Add address error: ${error.message}`);
    sendError(res, 500, 'Error adding address');
  }
};

/**
 * Update address
 * @route PUT /api/v1/users/addresses/:addressId
 * @access Private
 */
exports.updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    const address = user.addresses.id(addressId);
    if (!address) {
      return sendError(res, 404, 'Address not found');
    }

    // Update address fields
    Object.assign(address, req.body);
    await user.save();

    sendSuccess(res, 200, 'Address updated successfully', { addresses: user.addresses });
  } catch (error) {
    logger.error(`Update address error: ${error.message}`);
    sendError(res, 500, 'Error updating address');
  }
};

/**
 * Delete address
 * @route DELETE /api/v1/users/addresses/:addressId
 * @access Private
 */
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user._id);

    user.addresses.pull(addressId);
    await user.save();

    sendSuccess(res, 200, 'Address deleted successfully');
  } catch (error) {
    logger.error(`Delete address error: ${error.message}`);
    sendError(res, 500, 'Error deleting address');
  }
};

/**
 * Get user orders
 * @route GET /api/v1/users/orders
 * @access Private
 */
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('items.product', 'name images price');

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
    logger.error(`Get orders error: ${error.message}`);
    sendError(res, 500, 'Error retrieving orders');
  }
};

/**
 * Add product to wishlist
 * @route POST /api/v1/users/wishlist/:productId
 * @access Private
 */
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (user.wishlist.includes(productId)) {
      return sendError(res, 400, 'Product already in wishlist');
    }

    user.wishlist.push(productId);
    await user.save();

    sendSuccess(res, 200, 'Product added to wishlist');
  } catch (error) {
    logger.error(`Add to wishlist error: ${error.message}`);
    sendError(res, 500, 'Error adding to wishlist');
  }
};

/**
 * Remove product from wishlist
 * @route DELETE /api/v1/users/wishlist/:productId
 * @access Private
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    user.wishlist.pull(productId);
    await user.save();

    sendSuccess(res, 200, 'Product removed from wishlist');
  } catch (error) {
    logger.error(`Remove from wishlist error: ${error.message}`);
    sendError(res, 500, 'Error removing from wishlist');
  }
};

/**
 * Get wishlist
 * @route GET /api/v1/users/wishlist
 * @access Private
 */
exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    sendSuccess(res, 200, 'Wishlist retrieved successfully', { wishlist: user.wishlist });
  } catch (error) {
    logger.error(`Get wishlist error: ${error.message}`);
    sendError(res, 500, 'Error retrieving wishlist');
  }
};
