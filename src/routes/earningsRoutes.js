/**
 * @fileoverview Earnings routes for sellers
 * @module routes/earningsRoutes
 */

const express = require('express');
const {
  getEarningsSummary,
  getDetailedEarnings,
  getEarningsAnalytics
} = require('../controllers/earningsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Earnings
 *   description: Seller earnings management
 */

/**
 * @swagger
 * /api/v1/earnings/summary:
 *   get:
 *     summary: Get earnings summary by month
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings summary retrieved successfully
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
 *                     totalEarnings:
 *                       type: number
 *                     totalOrders:
 *                       type: number
 *                     monthlyEarnings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           amount:
 *                             type: number
 *                           orders:
 *                             type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Seller access only
 */
router.get('/summary', protect, authorize('seller', 'admin'), getEarningsSummary);

/**
 * @swagger
 * /api/v1/earnings/detailed:
 *   get:
 *     summary: Get detailed earnings with orders
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Detailed earnings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/detailed', protect, authorize('seller', 'admin'), getDetailedEarnings);

/**
 * @swagger
 * /api/v1/earnings/analytics:
 *   get:
 *     summary: Get earnings analytics and growth metrics
 *     tags: [Earnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', protect, authorize('seller', 'admin'), getEarningsAnalytics);

module.exports = router;
