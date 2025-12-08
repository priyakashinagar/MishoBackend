/**
 * @fileoverview Rating model schema
 * @module models/Rating
 */

const mongoose = require('mongoose');

/**
 * Rating Schema
 */
const ratingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      maxlength: 1000
    },
    title: {
      type: String,
      maxlength: 100
    },
    images: [{
      public_id: String,
      url: String
    }],
    helpful: {
      type: Number,
      default: 0
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Ensure one rating per user per product
ratingSchema.index({ user: 1, product: 1 }, { unique: true });

// Index for fetching product ratings
ratingSchema.index({ product: 1, createdAt: -1 });

/**
 * Static method to calculate average rating for a product
 */
ratingSchema.statics.calculateAverageRating = async function(productId) {
  const result = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (result.length > 0) {
    return {
      average: Math.round(result[0].averageRating * 10) / 10,
      count: result[0].count
    };
  }

  return { average: 0, count: 0 };
};

/**
 * Update product ratings after save
 */
ratingSchema.post('save', async function() {
  const Product = mongoose.model('Product');
  const stats = await this.constructor.calculateAverageRating(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    'ratings.average': stats.average,
    'ratings.count': stats.count
  });
});

/**
 * Update product ratings after remove
 */
ratingSchema.post('remove', async function() {
  const Product = mongoose.model('Product');
  const stats = await this.constructor.calculateAverageRating(this.product);
  
  await Product.findByIdAndUpdate(this.product, {
    'ratings.average': stats.average,
    'ratings.count': stats.count
  });
});

module.exports = mongoose.model('Rating', ratingSchema);
