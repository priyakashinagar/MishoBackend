/**
 * @fileoverview Seller routes
 * @module routes/sellerRoutes
 */

const express = require('express');
const { body } = require('express-validator');
const {
  getDashboard,
  getProfile,
  createProfile,
  updateProfile,
  submitKYC,
  addBankDetails,
  getProducts,
  updateProduct,
  getOrders,
  updateOrderStatus,
  getReturns,
  updateReturnStatus,
  getWallet,
  getPendingPayouts,
  getPayoutHistory,
  requestPayout,
  getEarningsBreakdown
} = require('../controllers/sellerController');
const { protect, authorize, verifySeller } = require('../middlewares/auth');
const { validate } = require('../middlewares/validator');
const { single, kycDocuments } = require('../config/multer');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Sellers
 *   description: Seller management and operations
 */

// Protect all routes
router.use(protect);
router.use(authorize('seller'));

/**
 * @swagger
 * /api/v1/sellers/dashboard:
 *   get:
 *     summary: Get seller dashboard stats
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalProducts:
 *                           type: number
 *                         totalOrders:
 *                           type: number
 *                         totalRevenue:
 *                           type: number
 *                         pendingOrders:
 *                           type: number
 *                     recentOrders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Seller verification required
 */
router.get('/dashboard', verifySeller, getDashboard);

/**
 * @swagger
 * /api/v1/sellers/profile:
 *   get:
 *     summary: Get seller profile
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile retrieved
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
 *                     seller:
 *                       $ref: '#/components/schemas/Seller'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', verifySeller, getProfile);

/**
 * @swagger
 * /api/v1/sellers/profile:
 *   post:
 *     summary: Create seller profile
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopName:
 *                 type: string
 *               businessType:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               panNumber:
 *                 type: string
 *               address:
 *                 type: object
 *               bankDetails:
 *                 type: object
 *     responses:
 *       201:
 *         description: Seller profile created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/profile', protect, createProfile);

/**
 * @swagger
 * /api/v1/sellers/profile:
 *   put:
 *     summary: Update seller profile
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               shopName:
 *                 type: string
 *               description:
 *                 type: string
 *               shopLogo:
 *                 type: string
 *                 format: binary
 *               businessAddress:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/profile', verifySeller, single('shopLogo'), updateProfile);

/**
 * @swagger
 * /api/v1/sellers/kyc:
 *   post:
 *     summary: Submit KYC documents
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - panCard
 *               - gstCertificate
 *             properties:
 *               panCard:
 *                 type: string
 *                 format: binary
 *                 description: PAN Card image
 *               gstCertificate:
 *                 type: string
 *                 format: binary
 *                 description: GST Certificate
 *               aadharCard:
 *                 type: string
 *                 format: binary
 *                 description: Aadhar Card (optional)
 *               businessProof:
 *                 type: string
 *                 format: binary
 *                 description: Business registration proof
 *     responses:
 *       200:
 *         description: KYC documents submitted for review
 *       400:
 *         description: Missing required documents
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/kyc', kycDocuments, submitKYC);

/**
 * @swagger
 * /api/v1/sellers/bank-details:
 *   post:
 *     summary: Add bank details for payout
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accountHolderName
 *               - accountNumber
 *               - ifscCode
 *               - bankName
 *             properties:
 *               accountHolderName:
 *                 type: string
 *                 example: "John Doe"
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890123456"
 *               ifscCode:
 *                 type: string
 *                 example: "SBIN0001234"
 *               bankName:
 *                 type: string
 *                 example: "State Bank of India"
 *               branchName:
 *                 type: string
 *                 example: "Main Branch"
 *     responses:
 *       200:
 *         description: Bank details added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/bank-details',
  [
    body('accountHolderName').notEmpty().withMessage('Account holder name is required'),
    body('accountNumber').notEmpty().withMessage('Account number is required'),
    body('ifscCode').notEmpty().withMessage('IFSC code is required'),
    body('bankName').notEmpty().withMessage('Bank name is required'),
    validate
  ],
  verifySeller,
  addBankDetails
);

/**
 * @swagger
 * /api/v1/sellers/products:
 *   get:
 *     summary: Get seller's products
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, out_of_stock]
 *     responses:
 *       200:
 *         description: Products retrieved successfully
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
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/products', verifySeller, getProducts);

/**
 * @swagger
 * /api/v1/sellers/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: number
 *                   status:
 *                     type: string
 *                     enum: [in_stock, out_of_stock]
 *                   lowStockThreshold:
 *                     type: number
 *               price:
 *                 type: number
 *               discount:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/products/:id', verifySeller, updateProduct);

/**
 * @swagger
 * /api/v1/sellers/orders:
 *   get:
 *     summary: Get seller's orders
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/orders', verifySeller, getOrders);

/**
 * @swagger
 * /api/v1/sellers/orders/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [confirmed, processing, shipped, delivered]
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Order not found
 */
router.put(
  '/orders/:orderId/status',
  [
    body('status')
      .isIn(['confirmed', 'processing', 'shipped', 'delivered'])
      .withMessage('Invalid status'),
    validate
  ],
  verifySeller,
  updateOrderStatus
);

// Returns routes
router.get('/returns', verifySeller, getReturns);
router.put('/returns/:orderId', verifySeller, updateReturnStatus);

// Wallet and Payout routes
router.get('/wallet', verifySeller, getWallet);
router.get('/payouts/pending', verifySeller, getPendingPayouts);
router.get('/payouts/history', verifySeller, getPayoutHistory);
router.post('/payouts/request', verifySeller, requestPayout);
router.get('/earnings/breakdown', verifySeller, getEarningsBreakdown);

module.exports = router;
