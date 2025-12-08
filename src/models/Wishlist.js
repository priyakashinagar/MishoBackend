/**
 * @fileoverview Wishlist model schema
 * @module models/Wishlist
 */

const mongoose = require('mongoose');

/**
 * Wishlist Schema
 */
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    products: [{
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

/**
 * Add product to wishlist
 */
wishlistSchema.methods.addProduct = async function(productId) {
  const exists = this.products.find(
    item => item.product.toString() === productId.toString()
  );

  if (!exists) {
    this.products.push({ product: productId });
    return this.save();
  }

  return this;
};

/**
 * Remove product from wishlist
 */
wishlistSchema.methods.removeProduct = async function(productId) {
  this.products = this.products.filter(
    item => item.product.toString() !== productId.toString()
  );
  return this.save();
};

/**
 * Check if product is in wishlist
 */
wishlistSchema.methods.hasProduct = function(productId) {
  return this.products.some(
    item => item.product.toString() === productId.toString()
  );
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
