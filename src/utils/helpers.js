/**
 * @fileoverview Helper utility functions
 * @module utils/helpers
 */

const crypto = require('crypto');

/**
 * Generate random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate OTP
 * @param {number} length - OTP length
 * @returns {string} OTP
 */
const generateOTP = (length = 6) => {
  // Static OTP for development/testing
  return '999000';
};

/**
 * Calculate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Pagination metadata
 */
const calculatePagination = (page = 1, limit = 10, total = 0) => {
  const totalPages = Math.ceil(total / limit);
  const skip = (page - 1) * limit;

  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    skip,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * Sanitize object by removing sensitive fields
 * @param {Object} obj - Object to sanitize
 * @param {Array<string>} fields - Fields to remove
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj, fields = ['password', '__v']) => {
  const sanitized = { ...obj };
  fields.forEach(field => delete sanitized[field]);
  return sanitized;
};

/**
 * Generate slug from string
 * @param {string} str - Input string
 * @returns {string} Slug
 */
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @returns {number} Percentage
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format currency
 * @param {number} amount - Amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Generate order ID
 * @returns {string} Order ID
 */
const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Remove null/undefined values from object
 * @param {Object} obj - Input object
 * @returns {Object} Cleaned object
 */
const removeEmptyValues = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

module.exports = {
  generateRandomString,
  generateOTP,
  calculatePagination,
  sanitizeObject,
  generateSlug,
  calculatePercentage,
  formatCurrency,
  generateOrderId,
  isValidEmail,
  isValidPhone,
  sleep,
  removeEmptyValues,
};
