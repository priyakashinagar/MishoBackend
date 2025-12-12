/**
 * @fileoverview Authentication controller
 * @module controllers/authController
 */

const User = require('../models/User');
const Seller = require('../models/Seller');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendSuccess, sendError, sendTokenResponse } = require('../utils/responseHandler');
const { generateOTP } = require('../utils/helpers');
const { sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, seller]
 *     responses:
 *       201:
 *         description: User registered successfully
 */
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return sendError(res, 400, 'User with this email or phone already exists');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: role === 'seller' ? 'seller' : 'user'
    });

    // If seller role, create seller profile
    if (role === 'seller') {
      await Seller.create({
        user: user._id,
        shopName: `${name}'s Shop`,
        businessType: 'individual'
      });
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      logger.error(`Welcome email failed: ${emailError.message}`);
    }

    // Generate token
    const token = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    user.password = undefined;

    sendTokenResponse(res, 201, 'User registered successfully', token, user);
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    sendError(res, 500, 'Error registering user', error.message);
  }
};

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return sendError(res, 400, 'Please provide email and password');
    }

    // Find user with password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      return sendError(res, 401, 'Your account has been deactivated');
    }

    // Verify password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate tokens
    const token = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Remove password from response
    user.password = undefined;

    // If seller, get seller profile ID
    let userData = user.toObject();
    if (user.role === 'seller') {
      const seller = await Seller.findOne({ user: user._id });
      if (seller) {
        userData.sellerId = seller._id;
      }
    }

    sendTokenResponse(res, 200, 'Login successful', token, userData);
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    sendError(res, 500, 'Error logging in', error.message);
  }
};

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
exports.logout = async (req, res) => {
  try {
    // Clear refresh token
    req.user.refreshToken = undefined;
    await req.user.save();

    // Clear cookie
    res.clearCookie('token');

    sendSuccess(res, 200, 'Logout successful');
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    sendError(res, 500, 'Error logging out', error.message);
  }
};

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, 400, 'Refresh token is required');
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Find user
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, 401, 'Invalid refresh token');
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    sendSuccess(res, 200, 'Token refreshed successfully', {
      token: newAccessToken
    });
  } catch (error) {
    logger.error(`Refresh token error: ${error.message}`);
    sendError(res, 401, 'Invalid or expired refresh token');
  }
};

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash and set to resetPasswordToken
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire (1 hour)
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Send email
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
      sendSuccess(res, 200, 'Password reset email sent');
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      logger.error(`Password reset email error: ${emailError.message}`);
      return sendError(res, 500, 'Email could not be sent');
    }
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    sendError(res, 500, 'Error processing request', error.message);
  }
};

/**
 * Get current logged-in user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('addresses');
    sendSuccess(res, 200, 'User retrieved successfully', { user });
  } catch (error) {
    logger.error(`Get me error: ${error.message}`);
    sendError(res, 500, 'Error retrieving user', error.message);
  }
};

/**
 * Check if phone number exists in database
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return sendError(res, 400, 'Phone number is required');
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    let isExistingUser = false;
    let hasSellerProfile = false;
    
    if (user) {
      isExistingUser = true;
      // Check if seller has completed profile
      if (user.role === 'seller') {
        const seller = await Seller.findOne({ user: user._id });
        hasSellerProfile = seller ? true : false;
      }
    }

    logger.info(`Phone check for ${phone}: exists=${isExistingUser}, hasSeller=${hasSellerProfile}`);

    sendSuccess(res, 200, 'Phone check completed', { 
      phone,
      isExistingUser,
      hasSellerProfile
    });
  } catch (error) {
    logger.error(`Check phone error: ${error.message}`);
    sendError(res, 500, 'Error checking phone', error.message);
  }
};

/**
 * Direct login for existing users (no OTP needed)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.directLogin = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return sendError(res, 400, 'Phone number is required');
    }

    // Find user by phone
    const user = await User.findOne({ phone });
    
    if (!user) {
      return sendError(res, 404, 'User not found. Please register first.');
    }

    // Check if user has verified phone before (has used OTP at least once)
    if (!user.isPhoneVerified) {
      return sendError(res, 401, 'Phone not verified. Please verify with OTP first.');
    }

    // Generate token
    const token = generateAccessToken(user._id);

    // Check if seller has profile and if it's complete
    let sellerId = null;
    let requiresOnboarding = false;
    let sellerProfile = null;
    
    if (user.role === 'seller') {
      const seller = await Seller.findOne({ user: user._id });
      if (seller) {
        sellerId = seller._id;
        sellerProfile = seller;
        
        // Check if seller profile is incomplete
        const hasShopName = seller.shopName && 
                           seller.shopName !== 'My Store' && 
                           seller.shopName.toLowerCase() !== 'my store' &&
                           seller.shopName.trim() !== '';
        const hasAddress = seller.businessAddress && 
                          seller.businessAddress.addressLine1 && 
                          seller.businessAddress.addressLine1 !== 'Address' &&
                          seller.businessAddress.addressLine1.trim() !== '';
        
        // Profile is complete if both shop name and address exist
        if (hasShopName && hasAddress) {
          requiresOnboarding = false;
          console.log(`✅ Seller profile complete - Shop: ${seller.shopName}, Address: ${seller.businessAddress.addressLine1}`);
        } else {
          requiresOnboarding = true;
          console.log(`⚠️ Seller profile incomplete - Shop: ${seller.shopName}, Address: ${seller.businessAddress?.addressLine1}`);
        }
      } else {
        // User is seller but no seller profile exists
        requiresOnboarding = true;
        console.log(`⚠️ No seller profile found for user: ${user._id}`);
      }
    }

    logger.info(`Direct login successful for ${phone}, requiresOnboarding: ${requiresOnboarding}`);

    sendSuccess(res, 200, 'Login successful', {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        sellerId: sellerId
      },
      token,
      requiresOnboarding,
      sellerProfile: sellerProfile ? {
        shopName: sellerProfile.shopName,
        businessAddress: sellerProfile.businessAddress,
        kycStatus: sellerProfile.kycStatus,
        isVerified: sellerProfile.isVerified
      } : null
    });
  } catch (error) {
    logger.error(`Direct login error: ${error.message}`);
    sendError(res, 500, 'Login failed', error.message);
  }
};

/**
 * Send OTP to phone number
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return sendError(res, 400, 'Phone number is required');
    }

    // Generate OTP (static 999000 for testing)
    const otp = generateOTP();

    // Find user by phone
    let user = await User.findOne({ phone });
    let isExistingUser = false;
    let hasSellerProfile = false;
    
    if (user) {
      // User exists
      isExistingUser = true;
      // Check if seller has completed profile
      if (user.role === 'seller') {
        const seller = await Seller.findOne({ user: user._id });
        hasSellerProfile = seller ? true : false;
      }
    } else {
      // Create temporary user entry with unique email
      const tempEmail = `${phone}@temp.meesho.com`;
      const tempPassword = Math.random().toString(36).slice(-8) + Date.now();
      
      user = await User.create({
        phone,
        name: `User_${phone}`,
        email: tempEmail,
        password: tempPassword,
        isPhoneVerified: false,
        role: 'seller' // Default to seller for seller panel
      });
    }

    // Store OTP and expiry
    user.otp = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save({ validateBeforeSave: false });

    // In production, send OTP via SMS
    logger.info(`OTP sent to ${phone}: ${otp}`);

    sendSuccess(res, 200, 'OTP sent successfully', { 
      phone,
      isExistingUser,
      hasSellerProfile,
      message: 'OTP has been sent to your phone number',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined // Only show in dev
    });
  } catch (error) {
    logger.error(`Send OTP error: ${error.message}`);
    sendError(res, 500, 'Error sending OTP', error.message);
  }
};

/**
 * Verify OTP and login/register user
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    logger.info(`Verify OTP request - Phone: ${phone}, OTP: ${otp}`);

    if (!phone || !otp) {
      logger.warn('Missing phone or OTP in request');
      return sendError(res, 400, 'Phone number and OTP are required');
    }

    // Find user with phone and valid OTP
    const user = await User.findOne({
      phone,
      otp,
      otpExpire: { $gt: Date.now() }
    });

    if (!user) {
      logger.warn(`No user found with phone: ${phone} and OTP: ${otp}`);
      return sendError(res, 401, 'Invalid or expired OTP');
    }

    logger.info(`User found, verifying OTP for user: ${user._id}`);

    // Mark phone as verified
    user.isPhoneVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const token = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    // Remove sensitive data
    user.password = undefined;

    // Get user data with sellerId if seller
    let userData = user.toObject();
    let requiresOnboarding = false;
    
    if (user.role === 'seller') {
      const seller = await Seller.findOne({ user: user._id });
      if (seller) {
        userData.sellerId = seller._id;
        
        // Check if seller profile is incomplete
        const hasShopName = seller.shopName && 
                           seller.shopName !== 'My Store' && 
                           seller.shopName.toLowerCase() !== 'my store' &&
                           seller.shopName.trim() !== '';
        const hasAddress = seller.businessAddress && 
                          seller.businessAddress.addressLine1 && 
                          seller.businessAddress.addressLine1 !== 'Address' &&
                          seller.businessAddress.addressLine1.trim() !== '';
        
        // Profile is complete if both shop name and address exist
        if (hasShopName && hasAddress) {
          requiresOnboarding = false;
          console.log(`✅ Seller profile complete - Shop: ${seller.shopName}, Address: ${seller.businessAddress.addressLine1}`);
        } else {
          requiresOnboarding = true;
          console.log(`⚠️ Seller profile incomplete - Shop: ${seller.shopName}, Address: ${seller.businessAddress?.addressLine1}`);
        }
      } else {
        // User is seller but no seller profile exists
        requiresOnboarding = true;
        console.log(`⚠️ No seller profile found for user: ${user._id}`);
      }
    }

    logger.info(`OTP verified successfully for user: ${user._id}, requiresOnboarding: ${requiresOnboarding}`);
    
    // Send response with requiresOnboarding flag
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: userData,
      requiresOnboarding
    });
  } catch (error) {
    logger.error(`Verify OTP error: ${error.message}`);
    sendError(res, 500, 'Error verifying OTP', error.message);
  }
};
