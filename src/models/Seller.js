/**
 * @fileoverview Seller model schema
 * @module models/Seller
 */

const mongoose = require('mongoose');

/**
 * Bank Details subdocument schema
 */
const bankDetailsSchema = new mongoose.Schema({
  accountHolderName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  bankName: { type: String, required: true },
  branch: String,
  isVerified: { type: Boolean, default: false }
}, { _id: false });

/**
 * KYC Documents subdocument schema
 */
const kycDocumentsSchema = new mongoose.Schema({
  aadharCard: {
    number: String,
    front: { public_id: String, url: String },
    back: { public_id: String, url: String }
  },
  panCard: {
    number: String,
    image: { public_id: String, url: String }
  },
  gst: {
    number: String,
    document: { public_id: String, url: String }
  },
  businessProof: {
    type: String,
    document: { public_id: String, url: String }
  }
}, { _id: false });

/**
 * Seller Schema
 * @typedef {Object} Seller
 * @property {ObjectId} user - Reference to User model
 * @property {string} shopName - Shop/Business name
 * @property {string} businessType - Type of business
 * @property {string} description - Shop description
 * @property {Object} businessAddress - Business address
 * @property {Object} kycDocuments - KYC documents
 * @property {Object} bankDetails - Bank account details
 * @property {string} kycStatus - KYC verification status
 * @property {boolean} isVerified - Seller verification status
 * @property {Object} stats - Seller statistics
 * @property {Object} ratings - Seller ratings
 * @property {Array<string>} categories - Product categories
 */
const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    shopName: {
      type: String,
      required: [true, 'Please provide shop name'],
      unique: true,
      trim: true,
      maxlength: [100, 'Shop name cannot exceed 100 characters']
    },
    shopLogo: {
      public_id: String,
      url: String
    },
    businessType: {
      type: String,
      required: true,
      enum: ['individual', 'partnership', 'proprietorship', 'private_limited', 'public_limited']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    businessAddress: {
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, default: 'India' }
    },
    kycDocuments: kycDocumentsSchema,
    kycStatus: {
      type: String,
      enum: ['pending', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'pending'
    },
    kycRejectionReason: String,
    bankDetails: bankDetailsSchema,
    isVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    stats: {
      totalProducts: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      pendingPayouts: { type: Number, default: 0 }
    },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },
    categories: [{
      type: String
    }],
    commission: {
      type: Number,
      default: 10, // 10% commission
      min: 0,
      max: 100
    },
    returnPolicy: {
      enabled: { type: Boolean, default: true },
      days: { type: Number, default: 7 }
    },
    shippingPolicy: {
      freeShipping: { type: Boolean, default: false },
      minOrderForFreeShipping: { type: Number, default: 0 }
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
// Note: user field already has unique: true in schema
sellerSchema.index({ isVerified: 1, isActive: 1 });
sellerSchema.index({ kycStatus: 1 });
sellerSchema.index({ 'ratings.average': -1 });

/**
 * Virtual for products
 */
sellerSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'seller',
  justOne: false
});

/**
 * Update seller stats
 * @param {Object} updates - Stats to update
 * @returns {Promise<Object>} Updated seller
 */
sellerSchema.methods.updateStats = async function (updates) {
  Object.keys(updates).forEach(key => {
    if (this.stats[key] !== undefined) {
      this.stats[key] += updates[key];
    }
  });
  return this.save();
};

/**
 * Calculate seller rating
 * @param {number} newRating - New rating value
 * @returns {Promise<Object>} Updated seller
 */
sellerSchema.methods.updateRating = async function (newRating) {
  const totalRating = this.ratings.average * this.ratings.count;
  this.ratings.count += 1;
  this.ratings.average = (totalRating + newRating) / this.ratings.count;
  return this.save();
};

module.exports = mongoose.model('Seller', sellerSchema);
