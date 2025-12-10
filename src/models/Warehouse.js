/**
 * @fileoverview Warehouse Model - Manages warehouse locations
 * @module models/Warehouse
 */

const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: ['main', 'regional', 'local', 'fulfillment'],
      default: 'main',
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: 'India',
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    contact: {
      phone: String,
      email: String,
      manager: String,
    },
    capacity: {
      total: {
        type: Number,
        default: 0,
      },
      occupied: {
        type: Number,
        default: 0,
      },
      available: {
        type: Number,
        default: 0,
      },
      unit: {
        type: String,
        enum: ['sqft', 'sqm', 'units'],
        default: 'sqft',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    facilities: [
      {
        type: String,
        enum: ['cold-storage', 'climate-control', 'security', 'loading-dock', 'parking'],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Calculate available capacity
warehouseSchema.pre('save', function (next) {
  this.capacity.available = this.capacity.total - this.capacity.occupied;
  next();
});

warehouseSchema.index({ sellerId: 1, status: 1 });
warehouseSchema.index({ code: 1 });

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse;
