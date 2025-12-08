/**
 * @fileoverview Cart model schema
 * @module models/Cart
 */

const mongoose = require('mongoose');

/**
 * Cart Item Schema
 */
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true
  },
  size: {
    type: String,
    default: 'Free Size'
  },
  color: {
    type: String,
    default: ''
  }
}, { _id: true });

/**
 * Cart Schema
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    items: [cartItemSchema],
    totalItems: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

/**
 * Calculate totals before saving
 */
cartSchema.pre('save', function(next) {
  this.totalItems = this.items.reduce((acc, item) => acc + item.quantity, 0);
  this.totalPrice = this.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  next();
});

/**
 * Add item to cart
 */
cartSchema.methods.addItem = async function(productId, quantity, price, size, color) {
  const existingItem = this.items.find(
    item => item.product.toString() === productId.toString() && 
            item.size === size && 
            item.color === color
  );

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity, price, size, color });
  }

  return this.save();
};

/**
 * Remove item from cart
 */
cartSchema.methods.removeItem = async function(productId, size, color) {
  this.items = this.items.filter(
    item => !(item.product.toString() === productId.toString() && 
              item.size === size && 
              item.color === color)
  );
  return this.save();
};

/**
 * Update item quantity
 */
cartSchema.methods.updateQuantity = async function(productId, quantity, size, color) {
  const item = this.items.find(
    item => item.product.toString() === productId.toString() && 
            item.size === size && 
            item.color === color
  );

  if (item) {
    if (quantity <= 0) {
      return this.removeItem(productId, size, color);
    }
    item.quantity = quantity;
  }

  return this.save();
};

/**
 * Clear cart
 */
cartSchema.methods.clearCart = async function() {
  this.items = [];
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
