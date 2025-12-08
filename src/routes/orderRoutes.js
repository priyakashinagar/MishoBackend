/**
 * @fileoverview Order routes
 * @module routes/orderRoutes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const {
  placeOrder,
  getUserOrders,
  getOrderById,
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  requestReturn
} = require('../controllers/orderController');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/order/place:
 *   post:
 *     summary: Place a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 description: Items to order (optional, uses cart if not provided)
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               shippingAddress:
 *                 oneOf:
 *                   - type: string
 *                     description: Simple address string
 *                     example: "123 Main Street, New Delhi, 110001"
 *                   - $ref: '#/components/schemas/Address'
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, online, wallet, upi, card, netbanking]
 *                 example: "cod"
 *               couponCode:
 *                 type: string
 *                 description: Optional coupon code
 *     responses:
 *       201:
 *         description: Order placed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Order placed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *       400:
 *         description: Cart is empty or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/place', placeOrder);

/**
 * @swagger
 * /api/v1/order/user:
 *   get:
 *     summary: Get current user's orders
 *     tags: [Orders]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled, returned]
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Order'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/user', getUserOrders);

/**
 * @swagger
 * /api/v1/order/seller:
 *   get:
 *     summary: Get seller's orders
 *     tags: [Orders]
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
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Seller orders retrieved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Seller access only
 */
router.get('/seller', authorize('seller', 'admin'), getSellerOrders);

/**
 * @swagger
 * /api/v1/order/admin:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
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
 *         description: All orders retrieved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin access only
 */
router.get('/admin', authorize('admin'), getAllOrders);

/**
 * @swagger
 * /api/v1/order/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID or Order Number
 *     responses:
 *       200:
 *         description: Order details
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
 *                     order:
 *                       $ref: '#/components/schemas/Order'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to view this order
 *       404:
 *         description: Order not found
 */
router.get('/:orderId', getOrderById);

/**
 * @swagger
 * /api/v1/order/update/{orderId}:
 *   put:
 *     summary: Update order status (Seller/Admin)
 *     tags: [Orders]
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
 *                 enum: [confirmed, processing, shipped, out_for_delivery, delivered]
 *                 example: "shipped"
 *               trackingNumber:
 *                 type: string
 *                 description: Tracking number for shipment
 *               trackingUrl:
 *                 type: string
 *                 description: Tracking URL
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status transition
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Seller/Admin access only
 *       404:
 *         description: Order not found
 */
router.put('/update/:orderId', authorize('seller', 'admin'), updateOrderStatus);

/**
 * @swagger
 * /api/v1/order/cancel/{orderId}:
 *   put:
 *     summary: Cancel order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Cancellation reason
 *                 example: "Changed my mind"
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Order cancelled successfully"
 *       400:
 *         description: Order cannot be cancelled (already shipped/delivered)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Order not found
 */
router.put('/cancel/:orderId', cancelOrder);

/**
 * @swagger
 * /api/v1/order/return/{orderId}:
 *   post:
 *     summary: Request order return
 *     tags: [Orders]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Return reason
 *                 example: "Product damaged"
 *               description:
 *                 type: string
 *                 description: Detailed description
 *     responses:
 *       200:
 *         description: Return request submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Return request submitted"
 *       400:
 *         description: Return window expired or order not delivered
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Order not found
 */
router.post('/return/:orderId', requestReturn);

module.exports = router;
