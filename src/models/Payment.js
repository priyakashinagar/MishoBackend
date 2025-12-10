/**
 * @fileoverview Payment Model - Manages seller payment transactions
 * @module models/Payment
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ['sale', 'refund', 'commission', 'penalty', 'settlement', 'advance'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    method: {
      type: String,
      enum: ['bank-transfer', 'upi', 'wallet', 'cash'],
      default: 'bank-transfer',
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
    },
    upiDetails: {
      upiId: String,
      vpa: String,
    },
    description: {
      type: String,
    },
    fees: {
      commission: {
        type: Number,
        default: 0,
      },
      shipping: {
        type: Number,
        default: 0,
      },
      tax: {
        type: Number,
        default: 0,
      },
      other: {
        type: Number,
        default: 0,
      },
    },
    netAmount: {
      type: Number,
      required: true,
    },
    settlementDate: {
      type: Date,
    },
    actualSettlementDate: {
      type: Date,
    },
    payoutBatchId: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentSchema.index({ sellerId: 1, status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ createdAt: -1 });

// Calculate net amount before saving
paymentSchema.pre('save', function (next) {
  const totalFees = this.fees.commission + this.fees.shipping + this.fees.tax + this.fees.other;
  
  if (this.type === 'sale' || this.type === 'settlement') {
    this.netAmount = this.amount - totalFees;
  } else if (this.type === 'refund') {
    this.netAmount = -this.amount;
  } else {
    this.netAmount = this.amount;
  }
  
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
