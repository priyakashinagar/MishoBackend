/**
 * @fileoverview Claim Model - Manages seller claims and disputes
 * @module models/Claim
 */

const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
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
    claimNumber: {
      type: String,
      unique: true,
      required: true,
    },
    type: {
      type: String,
      enum: ['payment-dispute', 'product-damage', 'quality-issue', 'return-dispute', 'shipping-issue', 'other'],
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['submitted', 'under-review', 'approved', 'rejected', 'resolved', 'closed'],
      default: 'submitted',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    attachments: [{
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    timeline: [
      {
        status: String,
        comment: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolution: {
      decision: String,
      comment: String,
      refundAmount: Number,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      resolvedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

claimSchema.index({ sellerId: 1, status: 1 });
claimSchema.index({ claimNumber: 1 });
claimSchema.index({ createdAt: -1 });

const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim;
