/**
 * @fileoverview Payout Transaction model schema
 * @module models/PayoutTransaction
 */

const mongoose = require('mongoose');

/**
 * Payout Transaction Schema
 * Records all payout transactions to sellers
 */
const payoutTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      default: () => `PAYOUT${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    // Orders included in this payout
    orders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],
    paymentMode: {
      type: String,
      enum: ['bank', 'upi', 'wallet'],
      default: 'bank'
    },
    // Bank/UPI details used for payout
    paymentDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      upiId: String,
      bankName: String
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
      index: true
    },
    // Processing details
    initiatedAt: {
      type: Date,
      default: Date.now
    },
    processedAt: Date,
    completedAt: Date,
    failedAt: Date,
    // Failure information
    failureReason: String,
    failureCode: String,
    // Payment gateway reference
    gatewayTransactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    // Admin who processed this payout
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    // Breakdown of payout
    breakdown: {
      totalOrders: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      totalCommission: { type: Number, default: 0 },
      totalTax: { type: Number, default: 0 },
      totalShipping: { type: Number, default: 0 },
      netAmount: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
payoutTransactionSchema.index({ seller: 1, createdAt: -1 });
payoutTransactionSchema.index({ status: 1, createdAt: -1 });
payoutTransactionSchema.index({ transactionId: 1 });

/**
 * Calculate breakdown from orders
 */
payoutTransactionSchema.methods.calculateBreakdown = async function () {
  try {
    await this.populate('orders');
    
    let totalOrders = this.orders.length;
    let totalSales = 0;
    let totalCommission = 0;
    let totalTax = 0;
    let totalShipping = 0;
    let netAmount = 0;
    
    this.orders.forEach(order => {
      if (order.earnings) {
        totalSales += order.pricing.itemsTotal;
        totalCommission += order.earnings.platformCommission || 0;
        totalTax += order.earnings.totalTax || 0;
        totalShipping += order.earnings.shippingCharges || 0;
        netAmount += order.earnings.netSellerEarning || 0;
      }
    });
    
    this.breakdown = {
      totalOrders,
      totalSales: Math.round(totalSales * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalShipping: Math.round(totalShipping * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100
    };
    
    this.amount = this.breakdown.netAmount;
    
    return this.breakdown;
  } catch (error) {
    console.error('Error calculating payout breakdown:', error);
    throw error;
  }
};

/**
 * Mark payout as completed
 */
payoutTransactionSchema.methods.markCompleted = async function (gatewayTransactionId, processedBy) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.gatewayTransactionId = gatewayTransactionId;
  this.processedBy = processedBy;
  
  // Update all orders in this payout
  const Order = mongoose.model('Order');
  await Order.updateMany(
    { _id: { $in: this.orders } },
    { 
      $set: { 
        'payout.status': 'completed',
        'payout.completedDate': new Date(),
        'payout.transactionId': this.transactionId
      }
    }
  );
  
  // Update seller wallet
  const SellerWallet = mongoose.model('SellerWallet');
  const wallet = await SellerWallet.getOrCreate(this.seller);
  wallet.completedPayout += this.amount;
  wallet.upcomingPayout -= this.amount;
  wallet.lastPayoutDate = new Date();
  wallet.lastPayoutAmount = this.amount;
  await wallet.save();
  
  await this.save();
  return this;
};

/**
 * Mark payout as failed
 */
payoutTransactionSchema.methods.markFailed = async function (reason, code) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.failureReason = reason;
  this.failureCode = code;
  
  // Update all orders in this payout
  const Order = mongoose.model('Order');
  await Order.updateMany(
    { _id: { $in: this.orders } },
    { 
      $set: { 
        'payout.status': 'failed',
        'payout.failureReason': reason
      }
    }
  );
  
  await this.save();
  return this;
};

module.exports = mongoose.model('PayoutTransaction', payoutTransactionSchema);
