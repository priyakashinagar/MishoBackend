/**
 * @fileoverview Catalog Routes - Handles catalog upload endpoints
 * @module routes/catalogRoutes
 */

const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/catalogs/';
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'catalog-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.endsWith('.csv') || 
        file.originalname.endsWith('.xlsx') || 
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Configure multer for image uploads
const imageStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/products/';
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const imageUpload = multer({
  storage: imageStorage,
  fileFilter: function (req, file, cb) {
    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif'
    ];
    
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit per image
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     CatalogItem:
 *       type: object
 *       required:
 *         - sellerId
 *         - uploadType
 *         - productData
 *       properties:
 *         _id:
 *           type: string
 *           description: Catalog item ID
 *         sellerId:
 *           type: string
 *           description: Seller ID reference
 *         uploadType:
 *           type: string
 *           enum: [bulk, single]
 *           description: Upload method type
 *         productData:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             description:
 *               type: string
 *             category:
 *               type: string
 *             subcategory:
 *               type: string
 *             price:
 *               type: number
 *             mrp:
 *               type: number
 *             discount:
 *               type: number
 *             stock:
 *               type: number
 *             sku:
 *               type: string
 *             brand:
 *               type: string
 *             color:
 *               type: string
 *             size:
 *               type: string
 *             weight:
 *               type: number
 *             images:
 *               type: array
 *               items:
 *                 type: string
 *             tags:
 *               type: array
 *               items:
 *                 type: string
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, published]
 *           default: pending
 *         productId:
 *           type: string
 *           description: Reference to published Product
 *         fileName:
 *           type: string
 *           description: Original filename for bulk uploads
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *         processedAt:
 *           type: string
 *           format: date-time
 *         errorMessage:
 *           type: string
 *     CatalogStats:
 *       type: object
 *       properties:
 *         totalUploads:
 *           type: number
 *         bulkUploads:
 *           type: number
 *         singleUploads:
 *           type: number
 *         pendingItems:
 *           type: number
 *         approvedItems:
 *           type: number
 */

/**
 * @swagger
 * /api/catalog/bulk-upload:
 *   post:
 *     summary: Bulk upload products from Excel/CSV file
 *     tags: [Catalog]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - sellerId
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel (.xlsx, .xls) or CSV file
 *               sellerId:
 *                 type: string
 *                 description: Seller ID
 *     responses:
 *       201:
 *         description: Products uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUploaded:
 *                       type: number
 *                     totalErrors:
 *                       type: number
 *                     errors:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: Bad request - Invalid file or missing data
 *       500:
 *         description: Server error
 */
router.post('/bulk-upload', upload.single('file'), catalogController.bulkCatalogUpload);

/**
 * @swagger
 * /api/catalog/bulk-image-upload:
 *   post:
 *     summary: Upload multiple product images
 *     tags: [Catalog]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *               - sellerId
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               sellerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: No images provided
 *       500:
 *         description: Server error
 */
router.post('/bulk-image-upload', imageUpload.array('images', 20), catalogController.bulkImageUpload);

/**
 * @swagger
 * /api/catalog/single-upload:
 *   post:
 *     summary: Upload a single product
 *     tags: [Catalog]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sellerId
 *               - productData
 *             properties:
 *               sellerId:
 *                 type: string
 *               productData:
 *                 type: object
 *                 required:
 *                   - name
 *                   - category
 *                   - price
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   subcategory:
 *                     type: string
 *                   price:
 *                     type: number
 *                   mrp:
 *                     type: number
 *                   stock:
 *                     type: number
 *                   sku:
 *                     type: string
 *                   brand:
 *                     type: string
 *                   color:
 *                     type: string
 *                   size:
 *                     type: string
 *     responses:
 *       201:
 *         description: Product uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CatalogItem'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/single-upload', catalogController.singleProductUpload);

/**
 * @swagger
 * /api/catalog/stats/{sellerId}:
 *   get:
 *     summary: Get catalog upload statistics for a seller
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *     responses:
 *       200:
 *         description: Upload statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/CatalogStats'
 *       500:
 *         description: Server error
 */
router.get('/stats/:sellerId', catalogController.getCatalogStats);

/**
 * @swagger
 * /api/catalog/{sellerId}:
 *   get:
 *     summary: Get all uploaded catalogs for a seller
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of catalog items
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
 *                     catalogs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CatalogItem'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         page:
 *                           type: number
 *                         pages:
 *                           type: number
 *                         limit:
 *                           type: number
 *       500:
 *         description: Server error
 */
router.get('/:sellerId', catalogController.getAllCatalogs);

/**
 * @swagger
 * /api/catalog/item/{id}:
 *   delete:
 *     summary: Delete a catalog item
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Catalog item ID
 *     responses:
 *       200:
 *         description: Catalog item deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Catalog item not found
 *       500:
 *         description: Server error
 */
router.delete('/item/:id', catalogController.deleteCatalogItem);

/**
 * @swagger
 * /api/catalog/publish/{id}:
 *   post:
 *     summary: Publish a catalog item as a product
 *     tags: [Catalog]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Catalog item ID
 *     responses:
 *       200:
 *         description: Product published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   description: Published product object
 *       404:
 *         description: Catalog item not found
 *       500:
 *         description: Server error
 */
router.post('/publish/:id', catalogController.publishCatalogItem);

module.exports = router;
