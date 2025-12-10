/**
 * @fileoverview KYC Model - Seller KYC verification
 */

const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      unique: true,
    },
    personalInfo: {
      fullName: { type: String, required: true },
      dob: Date,
      pan: { type: String, required: true },
      aadhaar: String,
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    businessInfo: {
      businessName: String,
      businessType: { type: String, enum: ['individual', 'partnership', 'company', 'llp'] },
      gstin: String,
      businessAddress: String,
    },
    documents: [
      {
        type: { type: String, enum: ['pan', 'aadhaar', 'gst', 'bank-statement', 'business-proof', 'address-proof'] },
        url: String,
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
        uploadedAt: { type: Date, default: Date.now },
        verifiedAt: Date,
        rejectionReason: String,
      },
    ],
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
      bankName: String,
      verified: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['not-started', 'incomplete', 'submitted', 'under-review', 'verified', 'rejected'],
      default: 'not-started',
    },
    verificationNotes: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('KYC', kycSchema);
