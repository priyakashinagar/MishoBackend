/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Product pricing management endpoints
 */

const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

/**
 * @swagger
 * /api/v1/pricing:
 *   get:
 *     summary: Get all pricing
 *     tags: [Pricing]
 *     responses:
 *       200:
 *         description: Pricing fetched successfully
 */
router.get('/', pricingController.getAllPricing);
router.get('/:id', pricingController.getPricingById);
router.post('/', pricingController.createPricing);
router.put('/:id', pricingController.updatePricing);
router.put('/:id/auto-price', pricingController.enableAutoPrice);

module.exports = router;
