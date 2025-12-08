/**
 * @fileoverview JWT token generation and verification utilities
 * @module config/jwt
 */

const jwt = require('jsonwebtoken');

/**
 * JWT token utility functions
 * @namespace jwtConfig
 */
const jwtConfig = {
  /**
   * Generate JWT access token
   * @param {string} userId - User ID
   * @param {string} role - User role (user/seller/admin)
   * @returns {string} JWT token
   */
  generateAccessToken: (userId, role) => {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  },

  /**
   * Generate JWT refresh token
   * @param {string} userId - User ID
   * @returns {string} JWT refresh token
   */
  generateRefreshToken: (userId) => {
    return jwt.sign(
      { id: userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
    );
  },

  /**
   * Verify JWT access token
   * @param {string} token - JWT token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid
   */
  verifyAccessToken: (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
  },

  /**
   * Verify JWT refresh token
   * @param {string} token - JWT refresh token to verify
   * @returns {Object} Decoded token payload
   * @throws {Error} If token is invalid
   */
  verifyRefreshToken: (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  },

  /**
   * Generate password reset token
   * @param {string} userId - User ID
   * @returns {string} Reset token
   */
  generateResetToken: (userId) => {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
};

module.exports = jwtConfig;
