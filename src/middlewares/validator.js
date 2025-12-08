/**
 * @fileoverview Request validation middleware using express-validator
 * @module middlewares/validator
 */

const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHandler');

/**
 * Validate request and return errors if any
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));

    return sendError(res, 400, 'Validation Error', formattedErrors);
  }
  
  next();
};

/**
 * Handle async errors in route handlers
 * @param {Function} fn - Async function
 * @returns {Function} Express middleware function
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
