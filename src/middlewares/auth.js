/**
 * @fileoverview Authentication middleware
 * @module middlewares/auth
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Protect routes - verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers or cookies
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return sendError(res, 401, 'Not authorized to access this route');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return sendError(res, 401, 'User not found');
      }

      if (!req.user.isActive) {
        return sendError(res, 401, 'Your account has been deactivated');
      }

      next();
    } catch (error) {
      logger.error(`Token verification error: ${error.message}`);
      return sendError(res, 401, 'Not authorized, token failed');
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return sendError(res, 500, 'Server error in authentication');
  }
};

/**
 * Authorize specific roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `User role ${req.user.role} is not authorized to access this route`
      );
    }
    next();
  };
};

/**
 * Optional authentication - user can be guest or authenticated
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
      } catch (error) {
        // Token invalid, continue as guest
        req.user = null;
      }
    }

    next();
  } catch (error) {
    logger.error(`Optional auth middleware error: ${error.message}`);
    next();
  }
};

/**
 * Verify seller profile exists
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.verifySeller = async (req, res, next) => {
  try {
    const Seller = require('../models/Seller');
    const seller = await Seller.findOne({ user: req.user._id });

    if (!seller) {
      return sendError(res, 404, 'Seller profile not found');
    }

    if (!seller.isActive) {
      return sendError(res, 403, 'Your seller account is inactive');
    }

    req.seller = seller;
    next();
  } catch (error) {
    logger.error(`Seller verification error: ${error.message}`);
    return sendError(res, 500, 'Error verifying seller');
  }
};

/**
 * Check if seller is verified
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.requireVerifiedSeller = (req, res, next) => {
  if (!req.seller.isVerified) {
    return sendError(res, 403, 'Your seller account is not verified yet');
  }
  next();
};
