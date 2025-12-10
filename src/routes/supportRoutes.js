/**
 * @swagger
 * tags:
 *   name: Support
 *   description: Support ticket management endpoints
 */

const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

/**
 * @swagger
 * /api/v1/support:
 *   get:
 *     summary: Get all support tickets
 *     tags: [Support]
 *     responses:
 *       200:
 *         description: Tickets fetched successfully
 */
router.get('/', supportController.getAllTickets);
router.get('/:id', supportController.getTicketById);
router.post('/', supportController.createTicket);
router.post('/:id/message', supportController.addMessage);
router.put('/:id/status', supportController.updateTicketStatus);

module.exports = router;
