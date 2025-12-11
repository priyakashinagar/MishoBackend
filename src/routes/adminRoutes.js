/**
 * @fileoverview Admin routes
 * @module routes/adminRoutes
 */

const express = require('express');
const {
  getDashboard,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllSellers,
  getSellerById,
  verifySeller,
  updateSellerStatus,
  getAllProducts,
  deleteProduct,
  getAllOrders,
  getAnalytics,
  // New routes
  getReturns,
  updateReturnStatus,
  getSalesReports,
  getCustomers,
  getPayments,
  getReviews,
  deleteReview,
  getShipments,
  updateShipment,
  getSettings,
  updateSettings,
  getKYCSubmissions,
  getSellerManagement,
  submitSupportTicket,
  getEarnings,
  // Payout routes
  getAllPendingPayouts,
  getAllPayoutHistory,
  getAllWallets
} = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin panel endpoints
 */

// Protect all routes and authorize only admin
router.use(protect);
router.use(authorize('admin'));

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved
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
 *                         totalUsers:
 *                           type: number
 *                         totalSellers:
 *                           type: number
 *                         totalProducts:
 *                           type: number
 *                         totalOrders:
 *                           type: number
 *                         totalRevenue:
 *                           type: number
 *                         pendingOrders:
 *                           type: number
 *                         pendingKYC:
 *                           type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access only
 */
router.get('/dashboard', getDashboard);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, seller, admin]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users list retrieved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get('/users/:userId', getUserById);

/**
 * @swagger
 * /api/v1/admin/users/{userId}/status:
 *   put:
 *     summary: Update user status (activate/deactivate)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User status updated
 *       404:
 *         description: User not found
 */
router.put('/users/:userId/status', updateUserStatus);

/**
 * @swagger
 * /api/v1/admin/sellers:
 *   get:
 *     summary: Get all sellers
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: kycStatus
 *         schema:
 *           type: string
 *           enum: [pending, submitted, under_review, approved, rejected]
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Sellers list retrieved
 */
router.get('/sellers', getAllSellers);

/**
 * @swagger
 * /api/v1/admin/sellers/{sellerId}:
 *   get:
 *     summary: Get seller details by ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seller details
 *       404:
 *         description: Seller not found
 */
router.get('/sellers/:sellerId', getSellerById);

/**
 * @swagger
 * /api/v1/admin/sellers/{sellerId}/verify:
 *   put:
 *     summary: Verify seller KYC
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
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
 *                 enum: [approved, rejected]
 *               rejectionReason:
 *                 type: string
 *                 description: Required if status is rejected
 *     responses:
 *       200:
 *         description: Seller verification updated
 *       400:
 *         description: Rejection reason required
 *       404:
 *         description: Seller not found
 */
router.put('/sellers/:sellerId/verify', verifySeller);

/**
 * @swagger
 * /api/v1/admin/sellers/{sellerId}/status:
 *   put:
 *     summary: Update seller status (activate/deactivate)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
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
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Seller status updated
 *       404:
 *         description: Seller not found
 */
router.put('/sellers/:sellerId/status', updateSellerStatus);

/**
 * @swagger
 * /api/v1/admin/products:
 *   get:
 *     summary: Get all products
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: seller
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Products list retrieved
 */
router.get('/products', getAllProducts);

/**
 * @swagger
 * /api/v1/admin/products/{productId}:
 *   delete:
 *     summary: Delete product
 *     tags: [Admin]
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
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/products/:productId', deleteProduct);

/**
 * @swagger
 * /api/v1/admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Orders list retrieved
 */
router.get('/orders', getAllOrders);

/**
 * @swagger
 * /api/v1/admin/analytics:
 *   get:
 *     summary: Get platform analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *     responses:
 *       200:
 *         description: Analytics data retrieved
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
 *                     revenue:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         growth:
 *                           type: number
 *                         chart:
 *                           type: array
 *                     orders:
 *                       type: object
 *                     users:
 *                       type: object
 *                     topProducts:
 *                       type: array
 *                     topSellers:
 *                       type: array
 */
router.get('/analytics', getAnalytics);

// Returns routes
router.get('/returns', getReturns);
router.put('/returns/:orderId', updateReturnStatus);

// Sales Reports routes
router.get('/reports/sales', getSalesReports);

// Customers routes
router.get('/customers', getCustomers);

// Payments routes
router.get('/payments', getPayments);

// Earnings routes
router.get('/earnings', getEarnings);

// Payout routes (admin view of all seller payouts)
router.get('/payouts/pending', getAllPendingPayouts);
router.get('/payouts/history', getAllPayoutHistory);
router.get('/wallet', getAllWallets);

// Reviews routes
router.get('/reviews', getReviews);
router.delete('/reviews/:reviewId', deleteReview);

// Shipping routes
router.get('/shipping', getShipments);
router.put('/shipping/:orderId', updateShipment);

// Settings routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// KYC routes
router.get('/kyc', getKYCSubmissions);

// Seller Management routes
router.get('/seller-management', getSellerManagement);

// Support routes
router.post('/support', submitSupportTicket);

module.exports = router;
