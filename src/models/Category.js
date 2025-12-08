/**
 * @fileoverview Category model schema
 * @module models/Category
 */

const mongoose = require('mongoose');

/**
 * Category Schema
 * @typedef {Object} Category
 * @property {string} name - Category name
 * @property {string} slug - URL-friendly slug
 * @property {string} description - Category description
 * @property {ObjectId} parent - Parent category reference
 * @property {Object} image - Category image
 * @property {boolean} isActive - Category active status
 * @property {number} order - Display order
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide category name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    },
    level: {
      type: Number,
      default: 0,
      enum: [0, 1, 2], // 0 = parent, 1 = subcategory, 2 = child subcategory
      required: true
    },
    image: {
      public_id: String,
      url: String
    },
    icon: String,
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    },
    // Commission percentage that admin takes from seller (hidden from sellers)
    commission: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    meta: {
      title: String,
      description: String,
      keywords: [String]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
// Note: slug field already has unique: true in schema
categorySchema.index({ parent: 1, isActive: 1 });

/**
 * Generate slug before saving - includes random suffix for uniqueness
 */
categorySchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Check if slug already exists
    const Category = this.constructor;
    let slug = baseSlug;
    let counter = 1;
    
    while (await Category.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

/**
 * Virtual for subcategories
 */
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

/**
 * Virtual for product count
 */
categorySchema.virtual('productCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  count: true
});

module.exports = mongoose.model('Category', categorySchema);
