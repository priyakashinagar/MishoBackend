/**
 * @fileoverview Product model schema
 * @module models/Product
 */

const mongoose = require('mongoose');

/**
 * Review subdocument schema
 */
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  images: [{
    public_id: String,
    url: String
  }],
  helpful: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

/**
 * Product Schema
 * @typedef {Object} Product
 * @property {string} name - Product name
 * @property {string} description - Product description
 * @property {ObjectId} seller - Seller reference
 * @property {ObjectId} category - Category reference
 * @property {number} price - Product price
 * @property {number} mrp - Maximum retail price
 * @property {number} discount - Discount percentage
 * @property {Array<Object>} images - Product images
 * @property {Object} stock - Stock information
 * @property {Array<Object>} variants - Product variants
 * @property {Array<string>} tags - Product tags
 * @property {Object} ratings - Product ratings
 * @property {Array<Object>} reviews - Product reviews
 * @property {Object} shipping - Shipping details
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'sellerModel',  // Dynamic reference
      required: true
    },
    sellerModel: {
      type: String,
      enum: ['Seller', 'User'],  // Can be Seller (for sellers) or User (for admin)
      default: 'Seller'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    subCategory: String,
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
      min: [0, 'Price cannot be negative']
    },
    mrp: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    images: [{
      public_id: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }],
    stock: {
      quantity: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },
      status: {
        type: String,
        enum: ['in_stock', 'out_of_stock', 'low_stock'],
        default: 'in_stock'
      },
      lowStockThreshold: {
        type: Number,
        default: 10
      }
    },
    // Available sizes for this product
    sizes: {
      type: [String],
      default: []
    },
    // Available colors with name and hex code
    colors: [{
      name: { type: String, required: true },
      code: { type: String, required: true }  // Hex color code like #e11d48
    }],
    variants: [{
      name: String, // e.g., "Size", "Color"
      options: [String], // e.g., ["S", "M", "L"], ["Red", "Blue"]
      price: Number,
      stock: Number
    }],
    specifications: {
      type: Map,
      of: String
    },
    tags: [String],
    ratings: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    reviews: [reviewSchema],
    shipping: {
      weight: Number, // in kg
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      },
      isFreeShipping: {
        type: Boolean,
        default: false
      },
      shippingCharge: {
        type: Number,
        default: 0
      },
      deliveryTime: {
        min: { type: Number, default: 3 }, // days
        max: { type: Number, default: 7 }
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    views: {
      type: Number,
      default: 0
    },
    soldCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ seller: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'ratings.average': -1 });
productSchema.index({ createdAt: -1 });

/**
 * Generate slug before saving
 */
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();
  }
  
  // Update stock status
  if (this.stock.quantity === 0) {
    this.stock.status = 'out_of_stock';
  } else if (this.stock.quantity <= this.stock.lowStockThreshold) {
    this.stock.status = 'low_stock';
  } else {
    this.stock.status = 'in_stock';
  }
  
  next();
});

/**
 * Calculate average rating
 * @returns {Promise<Object>} Updated product
 */
productSchema.methods.calculateAverageRating = async function () {
  if (this.reviews.length === 0) {
    this.ratings.average = 0;
    this.ratings.count = 0;
  } else {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.ratings.average = totalRating / this.reviews.length;
    this.ratings.count = this.reviews.length;
  }
  return this.save();
};

/**
 * Increment view count
 * @returns {Promise<Object>} Updated product
 */
productSchema.methods.incrementViews = async function () {
  this.views += 1;
  return this.save();
};

/**
 * Update stock
 * @param {number} quantity - Quantity to add/subtract
 * @returns {Promise<Object>} Updated product
 */
productSchema.methods.updateStock = async function (quantity) {
  this.stock.quantity += quantity;
  return this.save();
};

module.exports = mongoose.model('Product', productSchema);
