/**
 * @swagger
 * tags:
 *   name: KYC
 *   description: KYC verification endpoints
 */

const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');

/**
 * @swagger
 * /api/v1/kyc:
 *   get:
 *     summary: Get KYC status
 *     tags: [KYC]
 *     responses:
 *       200:
 *         description: KYC status fetched successfully
 */
router.get('/', kycController.getKYCStatus);
router.put('/', kycController.updateKYC);
router.post('/submit', kycController.submitKYC);
router.post('/upload-document', kycController.uploadDocument);

module.exports = router;
