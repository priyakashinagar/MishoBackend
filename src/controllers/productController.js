/**
 * @fileoverview Product controller for CRUD operations
 * @module controllers/productController
 */

const Product = require('../models/Product');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler');

/**
 * @desc    Create new product
 * @route   POST /api/v1/products
 * @access  Private (Seller/Admin)
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      subCategory,
      price,
      mrp,
      discount,
      stock,
      tags,
      isFreeShipping,
      shippingCharge,
      deliveryTimeMin,
      deliveryTimeMax,
      isFeatured,
      isActive
    } = req.body;

    // Handle image upload - convert buffer to base64 data URL for now
    // In production, upload to Cloudinary/S3 and get URL
    let productImages = [];
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      productImages = [{ 
        public_id: `product_${Date.now()}`, 
        url: imageUrl 
      }];
    }

    // Validate seller exists
    let sellerId = req.body.seller;
    
    // If admin is creating product, seller can be optional or use admin's ID
    if (req.user.role === 'admin') {
      // Admin can create products - use provided seller ID or make it optional
      if (!sellerId) {
        // Use admin's user ID as seller (for admin-created products)
        sellerId = req.user._id;
      }
    } else if (req.user.role === 'seller') {
      // For sellers, find their seller profile
      if (!sellerId) {
        const seller = await Seller.findOne({ user: req.user._id });
        if (!seller) {
          return next(new AppError('Seller profile not found', 404));
        }
        sellerId = seller._id;
      }
    } else {
      return next(new AppError('Unauthorized to create products', 403));
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new AppError('Category not found', 404));
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Parse stock if it's a string
    let stockData = stock;
    if (typeof stock === 'string') {
      try {
        stockData = JSON.parse(stock);
      } catch (e) {
        stockData = { quantity: parseInt(stock) || 0, status: 'out_of_stock' };
      }
    }

    // Parse tags if it's a string (comma-separated)
    let tagsArray = tags;
    if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    // Determine seller model type
    const sellerModel = req.user.role === 'admin' ? 'User' : 'Seller';

    // Build shipping object
    const shippingData = {
      weight: 0,
      dimensions: { length: 0, width: 0, height: 0 },
      isFreeShipping: isFreeShipping === 'true' || isFreeShipping === true,
      shippingCharge: parseFloat(shippingCharge) || 0,
      deliveryTime: { 
        min: parseInt(deliveryTimeMin) || 3, 
        max: parseInt(deliveryTimeMax) || 7 
      }
    };

    const product = await Product.create({
      name,
      slug,
      description,
      seller: sellerId,
      sellerModel,  // Set seller model type (User for admin, Seller for sellers)
      category,
      subCategory,
      price: parseFloat(price),
      mrp: parseFloat(mrp),
      discount: discount ? parseInt(discount) : Math.round(((parseFloat(mrp) - parseFloat(price)) / parseFloat(mrp)) * 100),
      images: productImages,
      stock: stockData || { quantity: 0, status: 'out_of_stock' },
      variants: [],
      tags: tagsArray || [],
      specifications: {},
      shipping: shippingData,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isActive: isActive !== 'false'
    });

    logger.info(`Product created: ${product._id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error creating product:', error);
    next(error);
  }
};

/**
 * @desc    Get all products with filters
 * @route   GET /api/v1/products
 * @access  Public
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      categoryName,
      subcategory,
      childCategory,
      seller,
      minPrice,
      maxPrice,
      rating,
      discount,
      search,
      sort = '-createdAt',
      inStock
    } = req.query;

    // Build query
    const query = {};

    // Handle category filtering by ID or name
    if (category) {
      // Check if it's a valid ObjectId
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        // It's a category name - find matching categories
        const categoryDoc = await Category.findOne({ 
          name: { $regex: new RegExp(`^${category.replace(/-/g, ' ')}$`, 'i') }
        });
        if (categoryDoc) {
          // Find all child categories (subcategories and their children)
          const allCategoryIds = [categoryDoc._id];
          
          // Find subcategories
          const subcategories = await Category.find({ parent: categoryDoc._id });
          subcategories.forEach(sub => allCategoryIds.push(sub._id));
          
          // Find child categories of subcategories
          const childCategories = await Category.find({ 
            parent: { $in: subcategories.map(s => s._id) }
          });
          childCategories.forEach(child => allCategoryIds.push(child._id));
          
          query.category = { $in: allCategoryIds };
        }
      }
    }
    
    // Handle categoryName filter (for direct name matching)
    if (categoryName) {
      const categoryDoc = await Category.findOne({ 
        name: { $regex: new RegExp(`^${categoryName.replace(/-/g, ' ')}$`, 'i') }
      });
      if (categoryDoc) {
        const allCategoryIds = [categoryDoc._id];
        const subcategories = await Category.find({ parent: categoryDoc._id });
        subcategories.forEach(sub => allCategoryIds.push(sub._id));
        const childCategories = await Category.find({ 
          parent: { $in: subcategories.map(s => s._id) }
        });
        childCategories.forEach(child => allCategoryIds.push(child._id));
        query.category = { $in: allCategoryIds };
      }
    }
    
    // Handle subcategory filter (level 1 or level 2)
    // URL slug converts hyphens to spaces, but category names may have hyphens
    if (subcategory || childCategory) {
      const searchTerm = childCategory || subcategory;
      // Create flexible regex: "summer-t-shirts" should match "Summer T-Shirts" or "Summer T Shirts"
      // Escape special regex chars first, then replace hyphens/spaces with pattern
      const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const flexiblePattern = escaped.replace(/[-\s]+/g, '[-\\s]+');
      
      // First try to find as child category (level 2 - most specific)
      let categoryDoc = await Category.findOne({ 
        name: { $regex: new RegExp(`^${flexiblePattern}$`, 'i') },
        level: 2
      });
      
      // If not found as child, try as subcategory (level 1)
      if (!categoryDoc) {
        categoryDoc = await Category.findOne({ 
          name: { $regex: new RegExp(`^${flexiblePattern}$`, 'i') },
          level: 1
        });
      }
      
      // If still not found, try any level
      if (!categoryDoc) {
        categoryDoc = await Category.findOne({ 
          name: { $regex: new RegExp(`^${flexiblePattern}$`, 'i') }
        });
      }
      
      if (categoryDoc) {
        if (categoryDoc.level === 2) {
          // Child category - exact match only
          query.category = categoryDoc._id;
        } else {
          // Subcategory - include all children
          const allCategoryIds = [categoryDoc._id];
          const childCategories = await Category.find({ parent: categoryDoc._id });
          childCategories.forEach(child => allCategoryIds.push(child._id));
          query.category = { $in: allCategoryIds };
        }
      }
    }

    if (seller) query.seller = seller;
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (rating) {
      query['ratings.average'] = { $gte: Number(rating) };
    }

    // Handle discount filter
    if (discount) {
      query.discount = { $gte: Number(discount) };
    }

    if (search) {
      // Split search into words for better matching
      const searchWords = search.split(/\s+/).filter(word => word.length > 0);
      if (searchWords.length > 1) {
        // Multiple words - search for any of them
        const regexWords = searchWords.map(word => new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        query.$or = [
          { name: { $regex: searchWords.join('|'), $options: 'i' } },
          { description: { $regex: searchWords.join('|'), $options: 'i' } },
          { tags: { $in: regexWords } }
        ];
      } else {
        // Single word search
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
    }

    if (inStock === 'true') {
      query['stock.quantity'] = { $gt: 0 };
    }

    // Get total count
    const total = await Product.countDocuments(query);

    // Execute query with pagination
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .populate('seller', 'shopName shopLogo ratings isVerified name')
      .select('-reviews') // Exclude reviews for performance
      .sort(sort)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    // Format seller data for products (handle both User and Seller models)
    products.forEach(product => {
      if (product.seller && product.sellerModel === 'User') {
        product.seller = {
          _id: product.seller._id,
          shopName: product.seller.name || 'Meesho Store',
          name: product.seller.name,
          isVerified: true
        };
      }
    });

    logger.info(`Fetched ${products.length} products, page ${page}`);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products
    });
  } catch (error) {
    logger.error('Error fetching products:', error);
    next(error);
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate({
        path: 'seller',
        select: 'shopName shopLogo description businessAddress ratings stats isVerified name phone email'
      })
      .populate('reviews.user', 'name')
      .lean();

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Handle seller data format (could be User or Seller model)
    if (product.seller && product.sellerModel === 'User') {
      // For User model sellers, create a compatible structure
      product.seller = {
        _id: product.seller._id,
        shopName: product.seller.name || 'Meesho Store',
        name: product.seller.name,
        phone: product.seller.phone,
        email: product.seller.email,
        isVerified: true,
        ratings: { average: 0, count: 0 },
        stats: { totalProducts: 0, totalOrders: 0 }
      };
    }

    logger.info(`Product fetched: ${product._id}`);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Error fetching product:', error);
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/v1/products/:id
 * @access  Private (Seller/Admin)
 */
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Check authorization
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (product.seller.toString() !== seller._id.toString()) {
        return next(new AppError('Not authorized to update this product', 403));
      }
    }

    // Parse nested fields from FormData
    const updateData = { ...req.body };
    
    // Parse stock object if sent as separate fields
    if (req.body['stock[quantity]']) {
      updateData.stock = {
        quantity: parseInt(req.body['stock[quantity]']),
        status: req.body['stock[status]'],
        lowStockThreshold: parseInt(req.body['stock[lowStockThreshold]'] || 10)
      };
      delete updateData['stock[quantity]'];
      delete updateData['stock[status]'];
      delete updateData['stock[lowStockThreshold]'];
    }
    
    // Parse shipping object if sent as separate fields
    if (req.body['shipping[isFreeShipping]']) {
      updateData.shipping = {
        isFreeShipping: req.body['shipping[isFreeShipping]'] === 'true',
        shippingCharge: parseFloat(req.body['shipping[shippingCharge]'] || 0),
        deliveryTime: {
          min: parseInt(req.body['shipping[deliveryTime][min]'] || 3),
          max: parseInt(req.body['shipping[deliveryTime][max]'] || 7)
        }
      };
      delete updateData['shipping[isFreeShipping]'];
      delete updateData['shipping[shippingCharge]'];
      delete updateData['shipping[deliveryTime][min]'];
      delete updateData['shipping[deliveryTime][max]'];
    }
    
    // Parse tags array if sent as separate fields
    const tags = [];
    Object.keys(req.body).forEach(key => {
      if (key.startsWith('tags[')) {
        tags.push(req.body[key]);
        delete updateData[key];
      }
    });
    if (tags.length > 0) {
      updateData.tags = tags;
    }

    // Handle image upload if new file provided
    if (req.file) {
      const base64Image = req.file.buffer.toString('base64');
      const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      updateData.images = [{
        url: dataUrl,
        altText: req.body.name || product.name,
        isPrimary: true
      }];
    }

    // Update slug if name changes
    if (updateData.name && updateData.name !== product.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Handle discount - use provided value or recalculate from price/mrp
    if (updateData.discount !== undefined) {
      updateData.discount = parseInt(updateData.discount) || 0;
      // Also recalculate price if MRP is available
      if (updateData.mrp || product.mrp) {
        const mrp = parseFloat(updateData.mrp || product.mrp);
        updateData.price = Math.round(mrp - (mrp * updateData.discount / 100));
      }
    } else if (updateData.price || updateData.mrp) {
      // Recalculate discount from price/mrp if discount not provided
      const price = parseFloat(updateData.price || product.price);
      const mrp = parseFloat(updateData.mrp || product.mrp);
      updateData.discount = Math.round(((mrp - price) / mrp) * 100);
    }

    // Convert string booleans to actual booleans
    if (typeof updateData.isFeatured === 'string') {
      updateData.isFeatured = updateData.isFeatured === 'true';
    }
    if (typeof updateData.isActive === 'string') {
      updateData.isActive = updateData.isActive === 'true';
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    logger.info(`Product updated: ${product._id} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    logger.error('Error updating product:', error);
    next(error);
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/v1/products/:id
 * @access  Private (Seller/Admin)
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Check authorization
    if (req.user.role === 'seller') {
      const seller = await Seller.findOne({ user: req.user._id });
      if (product.seller.toString() !== seller._id.toString()) {
        return next(new AppError('Not authorized to delete this product', 403));
      }
    }

    await product.deleteOne();

    logger.info(`Product deleted: ${req.params.id} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting product:', error);
    next(error);
  }
};

/**
 * @desc    Get products by seller
 * @route   GET /api/v1/products/seller/:sellerId
 * @access  Public
 */
exports.getProductsBySeller = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const query = { seller: req.params.sellerId };
    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .select('-reviews')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: products
    });
  } catch (error) {
    logger.error('Error fetching seller products:', error);
    next(error);
  }
};

/**
 * @desc    Get featured/trending products
 * @route   GET /api/v1/products/featured
 * @access  Public
 */
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const products = await Product.find({
      'ratings.average': { $gte: 4 },
      'stock.quantity': { $gt: 0 }
    })
      .populate('category', 'name slug')
      .populate('seller', 'businessName')
      .select('-reviews')
      .sort('-ratings.count -views')
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    logger.error('Error fetching featured products:', error);
    next(error);
  }
};
