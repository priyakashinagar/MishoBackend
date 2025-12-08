/**
 * @fileoverview Seller Wallet model schema
 * @module models/SellerWallet
 */

const mongoose = require('mongoose');

/**
 * Seller Wallet Schema
 * Tracks seller's earnings and payout status
 */
const sellerWalletSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      unique: true
    },
    // Orders delivered but in 7-day return window
    pendingAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    // Orders past return window, ready for payout
    upcomingPayout: {
      type: Number,
      default: 0,
      min: 0
    },
    // Total amount paid out to seller
    completedPayout: {
      type: Number,
      default: 0,
      min: 0
    },
    // Lifetime earnings (pending + upcoming + completed)
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0
    },
    lastPayoutDate: {
      type: Date,
      default: null
    },
    lastPayoutAmount: {
      type: Number,
      default: 0
    },
    // Next scheduled payout date
    nextPayoutDate: {
      type: Date,
      default: null
    },
    // Order count for tracking
    stats: {
      totalOrders: { type: Number, default: 0 },
      deliveredOrders: { type: Number, default: 0 },
      returnedOrders: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
sellerWalletSchema.index({ seller: 1 });

/**
 * Update wallet amounts from orders
 */
sellerWalletSchema.methods.updateFromOrders = async function () {
  try {
    const Order = mongoose.model('Order');
    const seller = this.seller;
    
    // Get all delivered orders for this seller
    const orders = await Order.find({
      'items.seller': seller,
      status: 'delivered',
      'earnings.netSellerEarning': { $gt: 0 }
    });
    
    let pendingAmount = 0;
    let upcomingPayout = 0;
    const now = new Date();
    
    orders.forEach(order => {
      const earning = order.earnings?.netSellerEarning || 0;
      const deliveredDate = order.deliveredAt || order.createdAt;
      const daysSinceDelivery = (now - deliveredDate) / (1000 * 60 * 60 * 24);
      
      // Skip if already part of a payout transaction
      if (order.payout?.status === 'completed' || order.payout?.status === 'processing') {
        return;
      }
      
      // If within 7-day return window
      if (daysSinceDelivery < 7) {
        pendingAmount += earning;
      } else {
        // Past return window, ready for payout (upcoming)
        upcomingPayout += earning;
      }
    });
    
    // Get completed payouts
    const PayoutTransaction = mongoose.model('PayoutTransaction');
    const completedPayouts = await PayoutTransaction.aggregate([
      { $match: { seller, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const completedPayout = completedPayouts.length > 0 ? completedPayouts[0].total : 0;
    
    // Update wallet
    this.pendingAmount = Math.round(pendingAmount * 100) / 100;
    this.upcomingPayout = Math.round(upcomingPayout * 100) / 100;
    this.completedPayout = Math.round(completedPayout * 100) / 100;
    this.totalEarnings = this.pendingAmount + this.upcomingPayout + this.completedPayout;
    
    // Update stats
    this.stats.deliveredOrders = orders.length;
    
    await this.save();
    return this;
  } catch (error) {
    console.error('Error updating wallet from orders:', error);
    throw error;
  }
};

/**
 * Get or create wallet for seller
 */
sellerWalletSchema.statics.getOrCreate = async function (sellerId) {
  let wallet = await this.findOne({ seller: sellerId });
  if (!wallet) {
    wallet = await this.create({ seller: sellerId });
  }
  return wallet;
};

module.exports = mongoose.model('SellerWallet', sellerWalletSchema);
