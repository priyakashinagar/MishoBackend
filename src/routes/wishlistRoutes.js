/**
 * @fileoverview Wishlist routes
 * @module routes/wishlistRoutes
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist,
  moveToCart
} = require('../controllers/wishlistController');

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management
 */

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/wishlist/my:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       $ref: '#/components/schemas/Wishlist'
 *                     count:
 *                       type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my', getWishlist);

/**
 * @swagger
 * /api/v1/wishlist/add:
 *   post:
 *     summary: Add product to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID to add
 *                 example: "6925acb65db2d8764758ad81"
 *     responses:
 *       200:
 *         description: Product added to wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Product added to wishlist"
 *                 data:
 *                   type: object
 *                   properties:
 *                     wishlist:
 *                       $ref: '#/components/schemas/Wishlist'
 *       400:
 *         description: Product already in wishlist
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Product not found
 */
router.post('/add', addToWishlist);

/**
 * @swagger
 * /api/v1/wishlist/remove/{productId}:
 *   delete:
 *     summary: Remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to remove
 *         example: "6925acb65db2d8764758ad81"
 *     responses:
 *       200:
 *         description: Product removed from wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Product removed from wishlist"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Product not in wishlist
 */
router.delete('/remove/:productId', removeFromWishlist);

/**
 * @swagger
 * /api/v1/wishlist/check/{productId}:
 *   get:
 *     summary: Check if product is in wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to check
 *         example: "6925acb65db2d8764758ad81"
 *     responses:
 *       200:
 *         description: Check result
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
 *                     inWishlist:
 *                       type: boolean
 *                       description: Whether product is in wishlist
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/check/:productId', checkWishlist);

/**
 * @swagger
 * /api/v1/wishlist/move-to-cart/{productId}:
 *   post:
 *     summary: Move item from wishlist to cart
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to move to cart
 *         example: "6925acb65db2d8764758ad81"
 *     responses:
 *       200:
 *         description: Product moved to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Product moved to cart"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Product not in wishlist
 */
router.post('/move-to-cart/:productId', moveToCart);

module.exports = router;
