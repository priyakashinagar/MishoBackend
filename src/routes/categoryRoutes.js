/**
 * @fileoverview Category routes with proper 3-level hierarchy
 * Parent (level 0) → Subcategory (level 1) → Child Subcategory (level 2)
 * @module routes/categoryRoutes
 */

const express = require('express');
const mongoose = require('mongoose');
const Category = require('../models/Category');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { protect, authorize } = require('../middlewares/auth');
const upload = require('../config/multer');

const router = express.Router();

/**
 * Helper function to strip commission from category data (for non-admin users)
 * Commission is admin-only data that sellers should not see
 */
const stripCommission = (category) => {
  if (!category) return category;
  const obj = category.toObject ? category.toObject() : { ...category };
  delete obj.commission;
  return obj;
};

const stripCommissionFromArray = (categories) => {
  return categories.map(cat => stripCommission(cat));
};

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: 3-level category hierarchy management
 */

// ==================== PARENT CATEGORY ROUTES ====================

/**
 * @swagger
 * /api/v1/categories/category/add:
 *   post:
 *     summary: Add parent category (level 0)
 *     tags: [Categories]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Electronics"
 *               slug:
 *                 type: string
 *                 example: "electronics"
 *               description:
 *                 type: string
 *                 example: "Electronic items and gadgets"
 *               image:
 *                 type: string
 *               icon:
 *                 type: string
 *               order:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Parent category created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/category/add', 
  protect, 
  authorize('admin'),
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]),
  async (req, res) => {
  try {
    const categoryData = {
      ...req.body,
      parent: null,
      level: 0
    };
    
    // Check if category name already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${categoryData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingCategory) {
      return sendError(res, 400, `Category "${categoryData.name}" already exists`);
    }
    
    // Convert commission to number
    if (categoryData.commission !== undefined) {
      categoryData.commission = Number(categoryData.commission) || 0;
    }
    
    // Handle uploaded image
    if (req.files?.image) {
      categoryData.image = {
        url: `/uploads/${req.files.image[0].filename}`,
        public_id: req.files.image[0].filename
      };
    }
    
    // Handle uploaded icon
    if (req.files?.icon) {
      categoryData.icon = `/uploads/${req.files.icon[0].filename}`;
    }
    
    const category = await Category.create(categoryData);
    sendSuccess(res, 201, 'Parent category created successfully', { category });
  } catch (error) {
    console.error('Error creating parent category:', error);
    // Handle duplicate key error
    if (error.code === 11000) {
      return sendError(res, 400, 'A category with this name already exists');
    }
    sendError(res, 500, error.message || 'Error creating category');
  }
});

/**
 * @swagger
 * /api/v1/categories/category/all:
 *   get:
 *     summary: Get all parent categories (level 0)
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Parent categories retrieved successfully
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
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *                     count:
 *                       type: number
 */
router.get('/category/all', async (req, res) => {
  try {
    // Check if request is from admin (has auth header and is admin)
    let isAdmin = false;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        isAdmin = user?.role === 'admin';
      } catch (e) {
        // Token invalid or expired, treat as non-admin
      }
    }

    const categories = await Category.find({ level: 0, isActive: true })
      .populate({
        path: 'subcategories',
        match: { isActive: true }
      })
      .sort({ order: 1 });

    // Only send commission data to admin
    const responseCategories = isAdmin ? categories : stripCommissionFromArray(categories);

    sendSuccess(res, 200, 'Parent categories retrieved successfully', { 
      categories: responseCategories,
      count: categories.length 
    });
  } catch (error) {
    console.error('Error retrieving categories:', error);
    sendError(res, 500, 'Error retrieving categories');
  }
});

// ==================== SUBCATEGORY ROUTES ====================

/**
 * @swagger
 * /api/v1/categories/subcategory/add:
 *   post:
 *     summary: Add subcategory (level 1)
 *     tags: [Categories]
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
 *               - parent
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Mobile Phones"
 *               parent:
 *                 type: string
 *                 description: Parent category ID (level 0)
 *                 example: "6925acb65db2d8764758ad81"
 *               slug:
 *                 type: string
 *                 example: "mobile-phones"
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               icon:
 *                 type: string
 *               order:
 *                 type: number
 *     responses:
 *       201:
 *         description: Subcategory created successfully
 *       400:
 *         description: Validation error or parent not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/subcategory/add', 
  protect, 
  authorize('admin'),
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]),
  async (req, res) => {
  try {
    const { parent, ...rest } = req.body;
    
    if (!parent) {
      return sendError(res, 400, 'Parent category ID is required');
    }

    // Check if category name already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${rest.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingCategory) {
      return sendError(res, 400, `Category "${rest.name}" already exists`);
    }

    // Verify parent exists and is level 0
    const parentCategory = await Category.findById(parent);
    if (!parentCategory) {
      return sendError(res, 404, 'Parent category not found');
    }
    if (parentCategory.level !== 0) {
      return sendError(res, 400, 'Parent must be a level 0 category');
    }

    const subcategoryData = {
      ...rest,
      parent,
      level: 1
    };
    
    // Convert commission to number
    if (subcategoryData.commission !== undefined) {
      subcategoryData.commission = Number(subcategoryData.commission) || 0;
    }
    
    // Handle uploaded image
    if (req.files?.image) {
      subcategoryData.image = {
        url: `/uploads/${req.files.image[0].filename}`,
        public_id: req.files.image[0].filename
      };
    }
    
    // Handle uploaded icon
    if (req.files?.icon) {
      subcategoryData.icon = `/uploads/${req.files.icon[0].filename}`;
    }
    
    const subcategory = await Category.create(subcategoryData);
    sendSuccess(res, 201, 'Subcategory created successfully', { subcategory });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    // Handle duplicate key error
    if (error.code === 11000) {
      return sendError(res, 400, 'A category with this name already exists');
    }
    sendError(res, 500, error.message || 'Error creating subcategory');
  }
});

/**
 * @swagger
 * /api/v1/categories/subcategory/{categoryId}:
 *   get:
 *     summary: Get subcategories of a parent category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Parent category ID (level 0)
 *         example: "6925acb65db2d8764758ad81"
 *     responses:
 *       200:
 *         description: Subcategories retrieved successfully
 *       404:
 *         description: Parent category not found
 *       500:
 *         description: Server error
 */
router.get('/subcategory/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Check if request is from admin
    let isAdmin = false;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        isAdmin = user?.role === 'admin';
      } catch (e) {}
    }

    // Verify parent category exists
    const parentCategory = await Category.findById(categoryId);
    if (!parentCategory) {
      return sendError(res, 404, 'Parent category not found');
    }

    const subcategories = await Category.find({ 
      parent: categoryId, 
      level: 1,
      isActive: true 
    })
    .populate({
      path: 'subcategories',
      match: { isActive: true }
    })
    .sort({ order: 1 });

    // Only send commission data to admin
    const responseSubcategories = isAdmin ? subcategories : stripCommissionFromArray(subcategories);

    sendSuccess(res, 200, 'Subcategories retrieved successfully', { 
      subcategories: responseSubcategories,
      count: subcategories.length,
      parentCategory: {
        id: parentCategory._id,
        name: parentCategory.name
      }
    });
  } catch (error) {
    console.error('Error retrieving subcategories:', error);
    sendError(res, 500, 'Error retrieving subcategories');
  }
});

// ==================== CHILD SUBCATEGORY ROUTES ====================

/**
 * @swagger
 * /api/v1/categories/child-category/add:
 *   post:
 *     summary: Add child subcategory (level 2)
 *     tags: [Categories]
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
 *               - parent
 *             properties:
 *               name:
 *                 type: string
 *                 example: "iPhone"
 *               parent:
 *                 type: string
 *                 description: Subcategory ID (level 1)
 *                 example: "6925acb65db2d8764758ad82"
 *               slug:
 *                 type: string
 *                 example: "iphone"
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               icon:
 *                 type: string
 *               order:
 *                 type: number
 *     responses:
 *       201:
 *         description: Child subcategory created successfully
 *       400:
 *         description: Validation error or parent not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/child-category/add', 
  protect, 
  authorize('admin'),
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]),
  async (req, res) => {
  try {
    const { parent, ...rest } = req.body;
    
    if (!parent) {
      return sendError(res, 400, 'Subcategory ID (parent) is required');
    }

    // Check if category name already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${rest.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });
    if (existingCategory) {
      return sendError(res, 400, `Category "${rest.name}" already exists`);
    }

    // Verify parent exists and is level 1
    const parentSubcategory = await Category.findById(parent);
    if (!parentSubcategory) {
      return sendError(res, 404, 'Subcategory not found');
    }
    if (parentSubcategory.level !== 1) {
      return sendError(res, 400, 'Parent must be a level 1 subcategory');
    }

    const childData = {
      ...rest,
      parent,
      level: 2
    };
    
    // Convert commission to number
    if (childData.commission !== undefined) {
      childData.commission = Number(childData.commission) || 0;
    }
    
    // Handle uploaded image
    if (req.files?.image) {
      childData.image = {
        url: `/uploads/${req.files.image[0].filename}`,
        public_id: req.files.image[0].filename
      };
    }
    
    // Handle uploaded icon
    if (req.files?.icon) {
      childData.icon = `/uploads/${req.files.icon[0].filename}`;
    }
    
    const childCategory = await Category.create(childData);
    sendSuccess(res, 201, 'Child subcategory created successfully', { childCategory });
  } catch (error) {
    console.error('Error creating child subcategory:', error);
    // Handle duplicate key error
    if (error.code === 11000) {
      return sendError(res, 400, 'A category with this name already exists');
    }
    sendError(res, 500, error.message || 'Error creating child subcategory');
  }
});

/**
 * @swagger
 * /api/v1/categories/child-category/{subCategoryId}:
 *   get:
 *     summary: Get child subcategories of a subcategory
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: subCategoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: Subcategory ID (level 1)
 *         example: "6925acb65db2d8764758ad82"
 *     responses:
 *       200:
 *         description: Child subcategories retrieved successfully
 *       404:
 *         description: Subcategory not found
 *       400:
 *         description: Invalid level
 *       500:
 *         description: Server error
 */
router.get('/child-category/:subCategoryId', async (req, res) => {
  try {
    const { subCategoryId } = req.params;

    // Check if request is from admin
    let isAdmin = false;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/User');
        const user = await User.findById(decoded.id);
        isAdmin = user?.role === 'admin';
      } catch (e) {}
    }

    // Verify subcategory exists
    const subcategory = await Category.findById(subCategoryId);
    if (!subcategory) {
      return sendError(res, 404, 'Subcategory not found');
    }
    if (subcategory.level !== 1) {
      return sendError(res, 400, 'Provided ID must be a level 1 subcategory');
    }

    const childCategories = await Category.find({ 
      parent: subCategoryId, 
      level: 2,
      isActive: true 
    }).sort({ order: 1 });

    // Only send commission data to admin
    const responseChildren = isAdmin ? childCategories : stripCommissionFromArray(childCategories);

    sendSuccess(res, 200, 'Child subcategories retrieved successfully', { 
      childCategories: responseChildren,
      count: childCategories.length,
      parentSubcategory: {
        id: subcategory._id,
        name: subcategory.name
      }
    });
  } catch (error) {
    console.error('Error retrieving child subcategories:', error);
    sendError(res, 500, 'Error retrieving child subcategories');
  }
});

// ==================== LEGACY/GENERIC ROUTES (backward compatibility) ====================

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all parent categories (legacy route)
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    // Get all parent categories (level 0)
    const parentCategories = await Category.find({ isActive: true, level: 0 })
      .sort({ order: 1 })
      .lean();

    // For each parent, get subcategories and their children
    const categoriesWithHierarchy = await Promise.all(
      parentCategories.map(async (parent) => {
        // Get subcategories (level 1)
        const subcategories = await Category.find({ 
          parent: parent._id, 
          level: 1, 
          isActive: true 
        }).sort({ order: 1 }).lean();

        // For each subcategory, get children (level 2)
        const subsWithChildren = await Promise.all(
          subcategories.map(async (sub) => {
            const children = await Category.find({ 
              parent: sub._id, 
              level: 2, 
              isActive: true 
            }).sort({ order: 1 }).select('name slug').lean();

            return {
              ...sub,
              children: children
            };
          })
        );

        return {
          ...parent,
          subcategories: subsWithChildren
        };
      })
    );

    sendSuccess(res, 200, 'Categories retrieved successfully', { categories: categoriesWithHierarchy });
  } catch (error) {
    console.error('Error fetching categories:', error);
    sendError(res, 500, 'Error retrieving categories');
  }
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get category by ID (legacy route)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories')
      .populate('parent');

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    sendSuccess(res, 200, 'Category retrieved successfully', { category });
  } catch (error) {
    sendError(res, 500, 'Error retrieving category');
  }
});

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Create category (legacy - use specific routes)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               parent:
 *                 type: string
 *               level:
 *                 type: number
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.create(req.body);
    sendSuccess(res, 201, 'Category created successfully', { category });
  } catch (error) {
    sendError(res, 500, 'Error creating category');
  }
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   put:
 *     summary: Update category (legacy route)
 *     tags: [Categories]
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
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put('/:id', 
  protect, 
  authorize('admin'),
  upload.fields([{ name: 'image', maxCount: 1 }, { name: 'icon', maxCount: 1 }]),
  async (req, res) => {
  try {
    const updateData = { ...req.body };
    const categoryId = req.params.id;
    
    console.log('Category update request:', categoryId, updateData);
    
    // First get the current category
    const currentCategory = await Category.findById(categoryId);
    if (!currentCategory) {
      return sendError(res, 404, 'Category not found');
    }
    
    // Remove empty strings and non-updatable fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '' || updateData[key] === undefined || updateData[key] === 'undefined') {
        delete updateData[key];
      }
    });
    
    // Check if name is being updated to a different name (case-insensitive)
    // Only check for duplicates if the name is actually different
    if (updateData.name && updateData.name.toLowerCase() !== currentCategory.name.toLowerCase()) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${updateData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      if (existingCategory) {
        return sendError(res, 400, 'A category with this name already exists');
      }
    }
    
    // Remove image from updateData if it's a string (old value from frontend)
    // Only update image if a new file is uploaded
    if (typeof updateData.image === 'string') {
      delete updateData.image;
    }
    
    // Handle uploaded image
    if (req.files?.image) {
      updateData.image = {
        url: `/uploads/${req.files.image[0].filename}`,
        public_id: req.files.image[0].filename
      };
    }
    
    // Handle uploaded icon (only if new file is uploaded)
    if (req.files?.icon) {
      updateData.icon = `/uploads/${req.files.icon[0].filename}`;
    } else if (typeof updateData.icon === 'string' && !updateData.icon.startsWith('/uploads/')) {
      // Remove invalid icon value
      delete updateData.icon;
    }
    
    // Convert commission to number if present
    if (updateData.commission !== undefined) {
      updateData.commission = Number(updateData.commission) || 0;
    }
    
    // Convert order to number if present
    if (updateData.order !== undefined) {
      updateData.order = Number(updateData.order) || 0;
    }
    
    // Don't update parent if it's "null" string
    if (updateData.parent === 'null' || updateData.parent === '') {
      delete updateData.parent;
    }
    
    console.log('Processed update data:', updateData);
    
    // Apply updates to the already fetched category
    Object.keys(updateData).forEach(key => {
      currentCategory[key] = updateData[key];
    });
    
    await currentCategory.save();

    console.log('Category updated successfully:', currentCategory._id);
    sendSuccess(res, 200, 'Category updated successfully', { category: currentCategory });
  } catch (error) {
    console.error('Category update error:', error.message, error.stack);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return sendError(res, 400, 'A category with this name already exists');
    }
    
    sendError(res, 500, error.message || 'Error updating category');
  }
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Delete category (legacy route)
 *     tags: [Categories]
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
 *         description: Category deleted
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return sendError(res, 404, 'Category not found');
    }

    sendSuccess(res, 200, 'Category deleted successfully');
  } catch (error) {
    sendError(res, 500, 'Error deleting category');
  }
});

module.exports = router;
