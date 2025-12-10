/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment management endpoints
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get all payments for a seller
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Payments fetched successfully
 */
router.get('/', paymentController.getAllPayments);

/**
 * @swagger
 * /api/v1/payments/{id}:
 *   get:
 *     summary: Get payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment fetched successfully
 */
router.get('/:id', paymentController.getPaymentById);

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Create new payment
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Payment created successfully
 */
router.post('/', paymentController.createPayment);

/**
 * @swagger
 * /api/v1/payments/{id}/status:
 *   put:
 *     summary: Update payment status
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 */
router.put('/:id/status', paymentController.updatePaymentStatus);

module.exports = router;
