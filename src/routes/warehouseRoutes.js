/**
 * @swagger
 * tags:
 *   name: Warehouses
 *   description: Warehouse management endpoints
 */

const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

/**
 * @swagger
 * /api/v1/warehouses:
 *   get:
 *     summary: Get all warehouses
 *     tags: [Warehouses]
 *     responses:
 *       200:
 *         description: Warehouses fetched successfully
 */
router.get('/', warehouseController.getAllWarehouses);
router.get('/:id', warehouseController.getWarehouseById);
router.post('/', warehouseController.createWarehouse);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

module.exports = router;
