/**
 * @fileoverview Catalog Model - Stores product catalog uploads
 * @module models/Catalog
 */

const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: [true, 'Seller ID is required']
  },
  uploadType: {
    type: String,
    enum: ['bulk', 'single'],
    required: [true, 'Upload type is required']
  },
  productData: {
    name: {
      type: String,
      required: [true, 'Product name is required']
    },
    description: {
      type: String
    },
    category: {
      type: String,
      required: [true, 'Category is required']
    },
    subcategory: {
      type: String
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative']
    },
    discount: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative']
    },
    sku: {
      type: String
    },
    brand: {
      type: String
    },
    color: {
      type: String
    },
    size: {
      type: String
    },
    weight: {
      type: Number
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    images: [{
      type: String
    }],
    tags: [{
      type: String
    }],
    specifications: {
      type: Map,
      of: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'published'],
    default: 'pending'
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  fileName: {
    type: String
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
catalogSchema.index({ sellerId: 1, uploadedAt: -1 });
catalogSchema.index({ sellerId: 1, uploadType: 1 });
catalogSchema.index({ status: 1 });

// Virtual for calculating discount percentage
catalogSchema.virtual('discountPercentage').get(function() {
  if (this.productData.mrp && this.productData.price) {
    return Math.round(((this.productData.mrp - this.productData.price) / this.productData.mrp) * 100);
  }
  return 0;
});

module.exports = mongoose.model('Catalog', catalogSchema);
