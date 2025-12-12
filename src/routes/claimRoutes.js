/**
 * @swagger
 * tags:
 *   name: Claims
 *   description: Claim management endpoints
 */

const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');
const { protect, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * /api/v1/claims:
 *   get:
 *     summary: Get all claims
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in-review, resolved, rejected]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Claims fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', protect, authorize('admin', 'seller', 'user'), claimController.getAllClaims);

/**
 * @swagger
 * /api/v1/claims/{id}:
 *   get:
 *     summary: Get claim by ID
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Claim fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Claim not found
 */
router.get('/:id', protect, claimController.getClaimById);

/**
 * @swagger
 * /api/v1/claims:
 *   post:
 *     summary: Create new claim
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - reason
 *               - description
 *             properties:
 *               orderId:
 *                 type: string
 *               reason:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Claim created successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/', protect, claimController.createClaim);

/**
 * @swagger
 * /api/v1/claims/{id}/status:
 *   put:
 *     summary: Update claim status
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in-review, resolved, rejected]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.put('/:id/status', protect, authorize('admin'), claimController.updateClaimStatus);

module.exports = router;
