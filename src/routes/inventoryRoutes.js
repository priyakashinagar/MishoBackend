/**
 * @fileoverview Inventory Routes - Handles inventory management endpoints
 * @module routes/inventoryRoutes
 */

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middlewares/auth');

// Apply authentication to all inventory routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management endpoints
 */

/**
 * @swagger
 * /api/v1/inventory:
 *   get:
 *     summary: Get all inventory items for a seller
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, in-stock, low-stock, out-of-stock, discontinued]
 *       - in: query
 *         name: search
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
 *         description: Inventory items fetched successfully
 *       500:
 *         description: Server error
 */
router.get('/', inventoryController.getAllInventory);

/**
 * @swagger
 * /api/v1/inventory/alerts/low-stock:
 *   get:
 *     summary: Get low stock and out of stock items
 *     tags: [Inventory]
 *     parameters:
 *       - in: query
 *         name: sellerId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Low stock items fetched successfully
 *       500:
 *         description: Server error
 */
router.get('/alerts/low-stock', inventoryController.getLowStockItems);

/**
 * @swagger
 * /api/v1/inventory/bulk-update:
 *   post:
 *     summary: Bulk update inventory stock
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     type:
 *                       type: string
 *                       enum: [addition, sale, adjustment]
 *                     reason:
 *                       type: string
 *     responses:
 *       200:
 *         description: Bulk update completed
 *       500:
 *         description: Server error
 */
router.post('/bulk-update', inventoryController.bulkStockUpdate);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   get:
 *     summary: Get inventory item by ID
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory item fetched successfully
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
router.get('/:id', inventoryController.getInventoryById);

/**
 * @swagger
 * /api/v1/inventory:
 *   post:
 *     summary: Create new inventory item
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - sku
 *             properties:
 *               productId:
 *                 type: string
 *               sellerId:
 *                 type: string
 *               sku:
 *                 type: string
 *               variant:
 *                 type: object
 *               stock:
 *                 type: object
 *                 properties:
 *                   available:
 *                     type: number
 *               reorderLevel:
 *                 type: number
 *               reorderQuantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *       500:
 *         description: Server error
 */
router.post('/', inventoryController.createInventory);

/**
 * @swagger
 * /api/v1/inventory/{id}/stock:
 *   put:
 *     summary: Update inventory stock
 *     tags: [Inventory]
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
 *               - quantity
 *               - type
 *             properties:
 *               quantity:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [addition, sale, return, damage, adjustment]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock updated successfully
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
router.put('/:id/stock', inventoryController.updateStock);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   put:
 *     summary: Update inventory item
 *     tags: [Inventory]
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
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
router.put('/:id', inventoryController.updateInventory);

/**
 * @swagger
 * /api/v1/inventory/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Inventory item deleted successfully
 *       404:
 *         description: Inventory item not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', inventoryController.deleteInventory);

module.exports = router;
