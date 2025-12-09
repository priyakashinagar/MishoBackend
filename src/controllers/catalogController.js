/**
 * @fileoverview Catalog Controller - Handles catalog upload operations
 * @module controllers/catalogController
 */

const Catalog = require('../models/Catalog');
const Product = require('../models/Product');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs').promises;

/**
 * Bulk catalog upload from Excel/CSV file
 * @route POST /api/catalog/bulk-upload
 */
exports.bulkCatalogUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'कृपया file upload करें'
      });
    }

    const sellerId = req.body.sellerId || req.seller?._id || req.user?._id;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID required'
      });
    }

    // Read the uploaded Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File में कोई data नहीं मिला'
      });
    }

    const catalogItems = [];
    const errors = [];

    // Process each row
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Extract values with flexible column name matching
        const productName = row['Product Name'] || row['product name'] || row['name'] || row['Name'] || row['PRODUCT NAME'];
        const category = row['Category'] || row['category'] || row['CATEGORY'];
        const price = parseFloat(row['Price'] || row['price'] || row['PRICE'] || 0);
        const mrp = parseFloat(row['MRP'] || row['mrp'] || row['Mrp'] || price);
        
        // Skip rows without required fields
        if (!productName || !category) {
          errors.push({
            row: i + 2, // +2 because Excel is 1-indexed and has header row
            error: `Missing required fields - Product Name: "${productName}", Category: "${category}"`
          });
          continue;
        }

        const catalogItem = {
          sellerId,
          uploadType: 'bulk',
          fileName: req.file.originalname,
          productData: {
            name: productName,
            description: row['Description'] || row['description'] || row['DESCRIPTION'] || '',
            category: category,
            subcategory: row['Subcategory'] || row['subcategory'] || row['SUBCATEGORY'] || '',
            price: price,
            mrp: mrp,
            stock: parseInt(row['Stock'] || row['stock'] || row['STOCK'] || 0),
            sku: row['SKU'] || row['sku'] || row['Sku'] || '',
            brand: row['Brand'] || row['brand'] || row['BRAND'] || '',
            color: row['Color'] || row['color'] || row['COLOR'] || '',
            size: row['Size'] || row['size'] || row['SIZE'] || '',
            weight: parseFloat(row['Weight'] || row['weight'] || row['WEIGHT'] || 0),
            images: (row['Images'] || row['images'] || row['IMAGES'] || '').split(',').map(img => img.trim()).filter(img => img),
            tags: (row['Tags'] || row['tags'] || row['TAGS'] || '').split(',').map(tag => tag.trim()).filter(tag => tag)
          },
          status: 'pending'
        };

        // Calculate discount if MRP is provided
        if (catalogItem.productData.mrp && catalogItem.productData.price) {
          catalogItem.productData.discount = Math.round(
            ((catalogItem.productData.mrp - catalogItem.productData.price) / catalogItem.productData.mrp) * 100
          );
        }

        catalogItems.push(catalogItem);
      } catch (error) {
        errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    // Check if we have any valid items to save
    if (catalogItems.length === 0) {
      // Delete the uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error deleting file:', err);
      }

      return res.status(400).json({
        success: false,
        message: 'No valid products found in file',
        data: {
          totalRows: data.length,
          totalErrors: errors.length,
          errors: errors
        }
      });
    }

    // Save all catalog items
    const savedItems = await Catalog.insertMany(catalogItems);

    // Delete the uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    res.status(201).json({
      success: true,
      message: `${savedItems.length} products successfully uploaded!`,
      data: {
        totalUploaded: savedItems.length,
        totalErrors: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

/**
 * Single product upload
 * @route POST /api/catalog/single-upload
 */
exports.singleProductUpload = async (req, res) => {
  try {
    const sellerId = req.body.sellerId || req.seller?._id || req.user?._id;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID required'
      });
    }

    const catalogItem = new Catalog({
      sellerId,
      uploadType: 'single',
      productData: req.body.productData,
      status: 'pending'
    });

    await catalogItem.save();

    res.status(201).json({
      success: true,
      message: 'Product uploaded successfully!',
      data: catalogItem
    });

  } catch (error) {
    console.error('Single upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

/**
 * Get upload statistics
 * @route GET /api/catalog/stats/:sellerId
 */
exports.getCatalogStats = async (req, res) => {
  try {
    const sellerId = req.params.sellerId || req.seller?._id || req.user?._id;

    const [totalUploads, bulkUploads, singleUploads, pendingItems, approvedItems] = await Promise.all([
      Catalog.countDocuments({ sellerId }),
      Catalog.countDocuments({ sellerId, uploadType: 'bulk' }),
      Catalog.countDocuments({ sellerId, uploadType: 'single' }),
      Catalog.countDocuments({ sellerId, status: 'pending' }),
      Catalog.countDocuments({ sellerId, status: 'approved' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUploads,
        bulkUploads,
        singleUploads,
        pendingItems,
        approvedItems
      }
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

/**
 * Get all uploaded catalogs for a seller
 * @route GET /api/catalog/:sellerId
 */
exports.getAllCatalogs = async (req, res) => {
  try {
    const sellerId = req.params.sellerId || req.seller?._id || req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [catalogs, total] = await Promise.all([
      Catalog.find({ sellerId })
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Catalog.countDocuments({ sellerId })
    ]);

    res.status(200).json({
      success: true,
      data: {
        catalogs,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get catalogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch catalogs',
      error: error.message
    });
  }
};

/**
 * Delete a catalog item
 * @route DELETE /api/catalog/item/:id
 */
exports.deleteCatalogItem = async (req, res) => {
  try {
    const catalogItem = await Catalog.findByIdAndDelete(req.params.id);

    if (!catalogItem) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Catalog item deleted successfully'
    });

  } catch (error) {
    console.error('Delete catalog error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete catalog item',
      error: error.message
    });
  }
};

/**
 * Publish catalog items as products
 * @route POST /api/catalog/publish/:id
 */
exports.publishCatalogItem = async (req, res) => {
  try {
    const catalogItem = await Catalog.findById(req.params.id);

    if (!catalogItem) {
      return res.status(404).json({
        success: false,
        message: 'Catalog item not found'
      });
    }

    // Create product from catalog data
    const product = new Product({
      seller: catalogItem.sellerId,
      ...catalogItem.productData
    });

    await product.save();

    // Update catalog item
    catalogItem.status = 'published';
    catalogItem.productId = product._id;
    catalogItem.processedAt = new Date();
    await catalogItem.save();

    res.status(200).json({
      success: true,
      message: 'Product published successfully',
      data: product
    });

  } catch (error) {
    console.error('Publish catalog error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Bulk image upload for catalog products
 * @route POST /api/catalog/bulk-image-upload
 */
exports.bulkImageUpload = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    const sellerId = req.body.sellerId || req.seller?._id || req.user?._id;
    
    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID required'
      });
    }

    // Process uploaded images
    const uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      url: `http://localhost:5000/uploads/products/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype
    }));

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} images uploaded successfully`,
      data: {
        images: uploadedImages,
        count: uploadedImages.length
      }
    });

  } catch (error) {
    console.error('Bulk image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};
