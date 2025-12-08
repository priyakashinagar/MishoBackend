/**
 * @fileoverview Product routes (public and seller)
 * @module routes/productRoutes
 */

const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductsBySeller,
  getFeaturedProducts
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/auth');
const { body } = require('express-validator');
const { validate } = require('../middlewares/validator');
const upload = require('../middlewares/upload');

const router = express.Router();

// Validation middleware
const productValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('mrp').isFloat({ min: 0 }).withMessage('Valid MRP is required'),
  validate
];

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     description: Retrieve all products with optional filters
 *     parameters:
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
 *         description: Number of products per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 */
router.get('/', getAllProducts);

/**
 * @route GET /api/v1/products/featured
 * @desc Get featured products
 * @access Public
 */
router.get('/featured', getFeaturedProducts);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/v1/products/seller/{sellerId}:
 *   get:
 *     summary: Get products by seller
 *     tags: [Products]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Seller products retrieved
 *       404:
 *         description: Seller not found
 */
router.get('/seller/:sellerId', getProductsBySeller);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create new product
 *     tags: [Products]
 *     description: Create a new product with complete details (Seller/Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - mrp
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *                 example: "Women's Western Dress"
 *               description:
 *                 type: string
 *                 description: Detailed product description
 *                 example: "Stylish and comfortable western dress perfect for casual outings. Made with premium quality fabric."
 *               price:
 *                 type: number
 *                 description: Selling price
 *                 example: 799
 *               mrp:
 *                 type: number
 *                 description: Maximum Retail Price (Original Price)
 *                 example: 2199
 *               discount:
 *                 type: number
 *                 description: Discount percentage (auto-calculated if not provided)
 *                 example: 64
 *               category:
 *                 type: string
 *                 description: Category ID (MongoDB ObjectId)
 *                 example: "6925acb65db2d8764758ad81"
 *               subCategory:
 *                 type: string
 *                 description: Sub-category name
 *                 example: "Western Wear"
 *               image:
 *                 type: string
 *                 description: Single image URL (will be converted to images array)
 *                 example: "https://images.meesho.com/images/products/1/1_512.jpg"
 *               images:
 *                 type: array
 *                 description: Array of product images
 *                 items:
 *                   type: object
 *                   properties:
 *                     public_id:
 *                       type: string
 *                       example: "product_123"
 *                     url:
 *                       type: string
 *                       example: "https://images.meesho.com/images/products/1/1_512.jpg"
 *               stock:
 *                 type: object
 *                 required:
 *                   - quantity
 *                 properties:
 *                   quantity:
 *                     type: number
 *                     description: Available stock quantity
 *                     example: 50
 *                   status:
 *                     type: string
 *                     enum: [in_stock, out_of_stock, low_stock]
 *                     description: Stock status
 *                     example: "in_stock"
 *                   lowStockThreshold:
 *                     type: number
 *                     description: Threshold for low stock alert
 *                     example: 10
 *               variants:
 *                 type: array
 *                 description: Product variants (size, color, etc.)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Size"
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["S", "M", "L", "XL"]
 *                     price:
 *                       type: number
 *                       example: 799
 *                     stock:
 *                       type: number
 *                       example: 20
 *               tags:
 *                 type: array
 *                 description: Product tags for search
 *                 items:
 *                   type: string
 *                 example: ["women", "dress", "western", "casual"]
 *               specifications:
 *                 type: object
 *                 description: Product specifications
 *                 additionalProperties:
 *                   type: string
 *                 example:
 *                   Material: "Cotton Blend"
 *                   Pattern: "Solid"
 *                   Fit: "Regular"
 *                   Sleeve: "Full Sleeve"
 *               shipping:
 *                 type: object
 *                 description: Shipping details
 *                 properties:
 *                   weight:
 *                     type: number
 *                     description: Weight in kg
 *                     example: 0.5
 *                   dimensions:
 *                     type: object
 *                     properties:
 *                       length:
 *                         type: number
 *                         example: 30
 *                       width:
 *                         type: number
 *                         example: 20
 *                       height:
 *                         type: number
 *                         example: 5
 *                   isFreeShipping:
 *                     type: boolean
 *                     example: true
 *                   shippingCharge:
 *                     type: number
 *                     example: 0
 *                   deliveryTime:
 *                     type: object
 *                     description: Delivery time range in days
 *                     properties:
 *                       min:
 *                         type: number
 *                         example: 3
 *                       max:
 *                         type: number
 *                         example: 7
 *               isFeatured:
 *                 type: boolean
 *                 description: Mark as featured product
 *                 example: false
 *               isActive:
 *                 type: boolean
 *                 description: Product active status
 *                 example: true
 *           examples:
 *             basicProduct:
 *               summary: Basic Product (Minimum Required)
 *               value:
 *                 name: "Women's Western Dress"
 *                 description: "Stylish and comfortable western dress"
 *                 price: 799
 *                 mrp: 2199
 *                 category: "6925acb65db2d8764758ad81"
 *                 image: "https://images.meesho.com/images/products/1/1_512.jpg"
 *                 stock:
 *                   quantity: 50
 *                   status: "in_stock"
 *             detailedProduct:
 *               summary: Detailed Product (All Fields)
 *               value:
 *                 name: "Women's Western Dress - Premium Collection"
 *                 description: "Stylish and comfortable western dress perfect for casual outings. Made with premium quality cotton blend fabric. Features full sleeves and solid pattern."
 *                 price: 799
 *                 mrp: 2199
 *                 discount: 64
 *                 category: "6925acb65db2d8764758ad81"
 *                 subCategory: "Western Wear"
 *                 image: "https://images.meesho.com/images/products/1/1_512.jpg"
 *                 stock:
 *                   quantity: 50
 *                   status: "in_stock"
 *                   lowStockThreshold: 10
 *                 variants:
 *                   - name: "Size"
 *                     options: ["S", "M", "L", "XL"]
 *                     price: 799
 *                     stock: 20
 *                   - name: "Color"
 *                     options: ["Red", "Blue", "Black"]
 *                     price: 799
 *                     stock: 30
 *                 tags: ["women", "dress", "western", "casual", "premium"]
 *                 specifications:
 *                   Material: "Cotton Blend"
 *                   Pattern: "Solid"
 *                   Fit: "Regular"
 *                   Sleeve: "Full Sleeve"
 *                   Occasion: "Casual"
 *                   Wash_Care: "Machine Wash"
 *                 shipping:
 *                   weight: 0.5
 *                   dimensions:
 *                     length: 30
 *                     width: 20
 *                     height: 5
 *                   isFreeShipping: true
 *                   shippingCharge: 0
 *                   deliveryTime:
 *                     min: 3
 *                     max: 7
 *                 isFeatured: false
 *                 isActive: true
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Product created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - No token provided
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Category or Seller not found
 */
router.post(
  '/',
  protect,
  authorize('seller', 'admin'),
  upload.single('image'),
  createProduct
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   get:
 *     summary: Get single product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 */
router.get('/:id', getProductById);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   put:
 *     summary: Update product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               mrp:
 *                 type: number
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *               stock:
 *                 type: object
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product not found
 */
router.put(
  '/:id',
  protect,
  authorize('seller', 'admin'),
  upload.single('image'),
  updateProduct
);

/**
 * @swagger
 * /api/v1/products/{id}:
 *   delete:
 *     summary: Delete product
 *     tags: [Products]
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
 *         description: Product deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to delete this product
 *       404:
 *         description: Product not found
 */
router.delete(
  '/:id',
  protect,
  authorize('seller', 'admin'),
  deleteProduct
);

module.exports = router;
