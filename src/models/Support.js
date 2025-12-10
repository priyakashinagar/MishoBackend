/**
 * @fileoverview Support Model - Manages support tickets
 * @module models/Support
 */

const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    category: {
      type: String,
      enum: ['technical', 'billing', 'product', 'shipping', 'account', 'general'],
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
    status: {
      type: String,
      enum: ['open', 'in-progress', 'waiting', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        attachments: [
          {
            url: String,
            name: String,
          },
        ],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
    resolvedAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
  }
);

supportSchema.index({ sellerId: 1, status: 1 });
supportSchema.index({ ticketNumber: 1 });
supportSchema.index({ createdAt: -1 });

const Support = mongoose.model('Support', supportSchema);

module.exports = Support;
