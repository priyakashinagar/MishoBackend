/**
 * @fileoverview Rating routes
 * @module routes/ratingRoutes
 */

const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middlewares/auth');
const {
  getProductRatings,
  addRating,
  updateRating,
  deleteRating,
  markHelpful,
  getMyRating
} = require('../controllers/ratingController');

/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: Product ratings and reviews
 */

/**
 * @swagger
 * /api/v1/rating/{productId}:
 *   get:
 *     summary: Get all ratings for a product
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *         example: "6925acb65db2d8764758ad81"
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
 *           default: 10
 *         description: Ratings per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, highest, lowest, helpful]
 *           default: newest
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Ratings retrieved successfully
 */
// Public route - Get product ratings (before protect middleware)
router.get('/:productId', getProductRatings);

// Protected routes - All routes below require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/rating/add:
 *   post:
 *     summary: Add a rating/review for a product
 *     tags: [Ratings]
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
 *               - rating
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID to rate
 *                 example: "6925acb65db2d8764758ad81"
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating value (1-5 stars)
 *                 example: 4
 *               title:
 *                 type: string
 *                 description: Review title
 *                 example: "Great product!"
 *               review:
 *                 type: string
 *                 description: Detailed review text
 *                 example: "This product exceeded my expectations. The quality is amazing and delivery was quick."
 *     responses:
 *       201:
 *         description: Rating added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Rating added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     rating:
 *                       $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Already rated or validation error
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Product not found
 */
router.post('/add', addRating);

/**
 * @swagger
 * /api/v1/rating/update/{ratingId}:
 *   put:
 *     summary: Update your rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Rating ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 5
 *               title:
 *                 type: string
 *                 example: "Updated review"
 *               review:
 *                 type: string
 *                 example: "Changed my rating after using for a month"
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to update this rating
 *       404:
 *         description: Rating not found
 */
router.put('/update/:ratingId', updateRating);

/**
 * @swagger
 * /api/v1/rating/delete/{ratingId}:
 *   delete:
 *     summary: Delete your rating
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Rating ID to delete
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Rating deleted successfully"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not authorized to delete this rating
 *       404:
 *         description: Rating not found
 */
router.delete('/delete/:ratingId', deleteRating);

/**
 * @swagger
 * /api/v1/rating/helpful/{ratingId}:
 *   post:
 *     summary: Mark a rating as helpful
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: string
 *         description: Rating ID to mark as helpful
 *     responses:
 *       200:
 *         description: Rating marked as helpful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: "Marked as helpful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     helpfulCount:
 *                       type: number
 *       400:
 *         description: Already marked as helpful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Rating not found
 */
router.post('/helpful/:ratingId', markHelpful);

/**
 * @swagger
 * /api/v1/rating/my/{productId}:
 *   get:
 *     summary: Get your rating for a product
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Your rating retrieved
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
 *                     rating:
 *                       $ref: '#/components/schemas/Rating'
 *                     hasRated:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my/:productId', getMyRating);

module.exports = router;
