/**
 * @fileoverview Inventory Model - Manages product stock and inventory
 * @module models/Inventory
 */

const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    variant: {
      size: String,
      color: String,
      material: String,
      other: String,
    },
    stock: {
      available: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      reserved: {
        type: Number,
        default: 0,
        min: 0,
      },
      damaged: {
        type: Number,
        default: 0,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
    },
    location: {
      shelf: String,
      bin: String,
      zone: String,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      default: 50,
      min: 0,
    },
    status: {
      type: String,
      enum: ['in-stock', 'low-stock', 'out-of-stock', 'discontinued'],
      default: 'in-stock',
    },
    lastRestocked: {
      type: Date,
    },
    stockHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        type: {
          type: String,
          enum: ['addition', 'sale', 'return', 'damage', 'adjustment'],
        },
        quantity: Number,
        reason: String,
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
inventorySchema.index({ sellerId: 1, productId: 1 });
inventorySchema.index({ sku: 1 });
inventorySchema.index({ status: 1 });

// Auto-calculate total stock
inventorySchema.pre('save', function (next) {
  this.stock.total = this.stock.available + this.stock.reserved + this.stock.damaged;
  
  // Update status based on stock levels
  if (this.stock.available === 0) {
    this.status = 'out-of-stock';
  } else if (this.stock.available <= this.reorderLevel) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
