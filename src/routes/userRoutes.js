/**
 * @fileoverview User routes
 * @module routes/userRoutes
 */

const express = require('express');
const { body, param } = require('express-validator');
const {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getOrders,
  addToWishlist,
  removeFromWishlist,
  getWishlist
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { profilePicture } = require('../config/multer');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile and address management
 */

// Protect all routes
router.use(protect);
router.use(authorize('user', 'seller', 'admin'));

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/profile', profilePicture, updateProfile);

/**
 * @swagger
 * /api/v1/users/addresses:
 *   post:
 *     summary: Add delivery address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *               - addressLine1
 *               - city
 *               - state
 *               - pincode
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               addressLine1:
 *                 type: string
 *                 example: "123 Main Street"
 *               addressLine2:
 *                 type: string
 *                 example: "Near City Mall"
 *               city:
 *                 type: string
 *                 example: "New Delhi"
 *               state:
 *                 type: string
 *                 example: "Delhi"
 *               pincode:
 *                 type: string
 *                 example: "110001"
 *               landmark:
 *                 type: string
 *                 example: "Opposite Metro Station"
 *               addressType:
 *                 type: string
 *                 enum: [home, work, other]
 *                 default: home
 *               isDefault:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Address added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/addresses',
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').isMobilePhone('en-IN').withMessage('Valid phone is required'),
    body('addressLine1').notEmpty().withMessage('Address line 1 is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('pincode').isLength({ min: 6, max: 6 }).withMessage('Valid pincode is required'),
    validate
  ],
  addAddress
);

/**
 * @swagger
 * /api/v1/users/addresses/{addressId}:
 *   put:
 *     summary: Update address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Address not found
 */
router.put('/addresses/:addressId', updateAddress);

/**
 * @swagger
 * /api/v1/users/addresses/{addressId}:
 *   delete:
 *     summary: Delete address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Address not found
 */
router.delete('/addresses/:addressId', deleteAddress);

/**
 * @swagger
 * /api/v1/users/orders:
 *   get:
 *     summary: Get user orders (legacy route)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/orders', getOrders);

/**
 * @swagger
 * /api/v1/users/wishlist:
 *   get:
 *     summary: Get user wishlist (legacy route)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/wishlist', getWishlist);

/**
 * @swagger
 * /api/v1/users/wishlist/{productId}:
 *   post:
 *     summary: Add to wishlist (legacy route)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Added to wishlist
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/wishlist/:productId', addToWishlist);

/**
 * @swagger
 * /api/v1/users/wishlist/{productId}:
 *   delete:
 *     summary: Remove from wishlist (legacy route)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Removed from wishlist
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/wishlist/:productId', removeFromWishlist);

module.exports = router;
