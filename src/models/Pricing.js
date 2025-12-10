/**
 * @fileoverview Pricing Model - Product pricing management
 */

const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      percentage: { type: Number, default: 0, min: 0, max: 100 },
      amount: { type: Number, default: 0 },
    },
    margin: {
      type: Number,
      default: 0,
    },
    autoPrice: {
      enabled: { type: Boolean, default: false },
      strategy: { type: String, enum: ['competitive', 'profit-maximization', 'volume-based'], default: 'competitive' },
      minPrice: Number,
      maxPrice: Number,
    },
    priceHistory: [
      {
        price: Number,
        changedAt: { type: Date, default: Date.now },
        reason: String,
      },
    ],
  },
  { timestamps: true }
);

pricingSchema.pre('save', function (next) {
  this.discount.amount = this.mrp - this.sellingPrice;
  this.discount.percentage = ((this.mrp - this.sellingPrice) / this.mrp) * 100;
  this.margin = ((this.sellingPrice - this.basePrice) / this.sellingPrice) * 100;
  next();
});

module.exports = mongoose.model('Pricing', pricingSchema);
