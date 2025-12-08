/**
 * @fileoverview Order model schema
 * @module models/Order
 */

const mongoose = require('mongoose');

/**
 * Order Item subdocument schema
 */
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variant: String,
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  }
}, { _id: true });

/**
 * Order Schema
 * @typedef {Object} Order
 * @property {string} orderId - Unique order ID
 * @property {ObjectId} user - User reference
 * @property {Array<Object>} items - Order items
 * @property {Object} shippingAddress - Delivery address
 * @property {Object} payment - Payment details
 * @property {Object} pricing - Price breakdown
 * @property {string} status - Order status
 * @property {Array<Object>} statusHistory - Status change history
 */
const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      landmark: String
    },
    payment: {
      method: {
        type: String,
        enum: ['cod', 'online', 'wallet'],
        required: true
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
      },
      transactionId: String,
      paidAt: Date
    },
    pricing: {
      itemsTotal: { type: Number, required: true },
      shippingCharge: { type: Number, default: 40 },
      tax: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true }
    },
    // Seller Earning Calculation Fields
    earnings: {
      commissionPercent: { type: Number, default: 0 }, // Category/seller commission %
      platformCommission: { type: Number, default: 0 }, // Actual commission amount
      shippingCharges: { type: Number, default: 40 }, // Shipping cost
      cgst: { type: Number, default: 0 }, // 9% CGST on commission
      sgst: { type: Number, default: 0 }, // 9% SGST on commission
      totalTax: { type: Number, default: 0 }, // Total GST (CGST + SGST)
      penalty: { type: Number, default: 0 }, // Any penalties
      netSellerEarning: { type: Number, default: 0 }, // Final seller earning
      calculatedAt: Date
    },
    payout: {
      status: {
        type: String,
        enum: ['pending', 'upcoming', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      scheduledDate: Date, // When payout is scheduled
      completedDate: Date, // When payout was completed
      transactionId: String,
      failureReason: String
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'return_requested', 'return_approved', 'return_rejected', 'returned', 'refunded'],
      default: 'pending'
    },
    statusHistory: [{
      status: String,
      comment: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }],
    tracking: {
      courier: String,
      trackingId: String,
      url: String
    },
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    returnRequest: {
      requested: { type: Boolean, default: false },
      reason: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed']
      },
      requestedAt: Date,
      approvedAt: Date,
      rejectedAt: Date,
      completedAt: Date,
      rejectionReason: String
    },
    returnReason: String,
    returnNotes: String,
    notes: String
  },
  {
    timestamps: true
  }
);

// Indexes
// Note: orderId field already has unique: true in schema
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ 'items.seller': 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

/**
 * Add status to history before updating
 */
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

/**
 * Calculate seller earnings after order delivery
 * Formula: Product Price - Platform Commission - Shipping - Tax - Penalty
 */
orderSchema.methods.calculateSellerEarnings = async function () {
  try {
    const Order = this.constructor;
    const Seller = mongoose.model('Seller');
    const Category = mongoose.model('Category');
    
    // Get first item's details
    const firstItem = this.items[0];
    if (!firstItem) return;
    
    await this.populate('items.product');
    const product = firstItem.product;
    
    // Get commission percentage (category > seller > default 10%)
    let commissionPercent = 10;
    
    if (product && product.category) {
      const category = await Category.findById(product.category);
      if (category && category.commission > 0) {
        commissionPercent = category.commission;
      }
    }
    
    if (!commissionPercent || commissionPercent === 0) {
      const seller = await Seller.findById(firstItem.seller);
      if (seller && seller.commission > 0) {
        commissionPercent = seller.commission;
      }
    }
    
    // Calculate amounts
    const productPrice = this.pricing.itemsTotal;
    const platformCommission = (productPrice * commissionPercent) / 100;
    const shippingCharges = this.pricing.shippingCharge || 40;
    
    // GST calculation: 9% CGST + 9% SGST on commission
    const cgst = (platformCommission * 9) / 100;
    const sgst = (platformCommission * 9) / 100;
    const totalTax = cgst + sgst;
    
    // Net seller earning
    const netSellerEarning = productPrice - platformCommission - shippingCharges - totalTax;
    
    // Update earnings object
    this.earnings = {
      commissionPercent,
      platformCommission: Math.round(platformCommission * 100) / 100,
      shippingCharges,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      penalty: this.earnings?.penalty || 0,
      netSellerEarning: Math.round(netSellerEarning * 100) / 100,
      calculatedAt: new Date()
    };
    
    // Set payout status to upcoming (will be processed after 7 days)
    if (this.status === 'delivered' && !this.payout.status) {
      this.payout.status = 'upcoming';
      // Schedule payout 7 days after delivery
      const scheduledDate = new Date(this.deliveredAt);
      scheduledDate.setDate(scheduledDate.getDate() + 7);
      this.payout.scheduledDate = scheduledDate;
    }
    
    return this.earnings;
  } catch (error) {
    console.error('Error calculating seller earnings:', error);
    throw error;
  }
};

/**
 * Calculate total price
 * @returns {number} Total price
 */
orderSchema.methods.calculateTotal = function () {
  const itemsTotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.pricing.itemsTotal = itemsTotal;
  this.pricing.total = itemsTotal + this.pricing.shippingCharge + this.pricing.tax - this.pricing.discount;
  return this.pricing.total;
};

module.exports = mongoose.model('Order', orderSchema);
