/**
 * @swagger
 * tags:
 *   name: Claims
 *   description: Claim management endpoints
 */

const express = require('express');
const router = express.Router();
const claimController = require('../controllers/claimController');

/**
 * @swagger
 * /api/v1/claims:
 *   get:
 *     summary: Get all claims
 *     tags: [Claims]
 *     responses:
 *       200:
 *         description: Claims fetched successfully
 */
router.get('/', claimController.getAllClaims);
router.get('/:id', claimController.getClaimById);
router.post('/', claimController.createClaim);
router.put('/:id/status', claimController.updateClaimStatus);

module.exports = router;
