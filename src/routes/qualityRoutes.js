/**
 * @swagger
 * tags:
 *   name: Quality
 *   description: Product quality management endpoints
 */

const express = require('express');
const router = express.Router();
const qualityController = require('../controllers/qualityController');

/**
 * @swagger
 * /api/v1/quality:
 *   get:
 *     summary: Get quality metrics
 *     tags: [Quality]
 *     responses:
 *       200:
 *         description: Quality metrics fetched successfully
 */
router.get('/', qualityController.getQualityMetrics);
router.get('/:id', qualityController.getQualityById);
router.put('/:id', qualityController.updateQualityMetrics);

module.exports = router;
