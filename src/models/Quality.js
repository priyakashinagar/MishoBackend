/**
 * @fileoverview Quality Model - Product quality metrics
 */

const mongoose = require('mongoose');

const qualitySchema = new mongoose.Schema(
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
    metrics: {
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalReviews: { type: Number, default: 0 },
      returnRate: { type: Number, default: 0 },
      defectRate: { type: Number, default: 0 },
      customerSatisfaction: { type: Number, default: 0 },
    },
    issues: [
      {
        type: { type: String, enum: ['defect', 'damage', 'wrong-item', 'quality-issue', 'packaging'] },
        count: { type: Number, default: 0 },
        severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      },
    ],
    score: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['excellent', 'good', 'average', 'poor'],
      default: 'good',
    },
    lastAudit: Date,
  },
  { timestamps: true }
);

qualitySchema.pre('save', function (next) {
  const { averageRating, returnRate, defectRate } = this.metrics;
  this.score = Math.max(0, 100 - (returnRate * 2) - (defectRate * 3) + (averageRating * 5));
  
  if (this.score >= 85) this.status = 'excellent';
  else if (this.score >= 70) this.status = 'good';
  else if (this.score >= 50) this.status = 'average';
  else this.status = 'poor';
  
  next();
});

module.exports = mongoose.model('Quality', qualitySchema);
