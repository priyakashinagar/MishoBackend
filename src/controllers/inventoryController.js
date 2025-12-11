/**
 * @fileoverview Inventory Controller - Handles inventory operations
 * @module controllers/inventoryController
 */

const Inventory = require('../models/Inventory');
const Product = require('../models/Product');

/**
 * Get all inventory items for a seller
 * @route GET /api/v1/inventory
 */
exports.getAllInventory = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;
    const isAdmin = req.user?.role === 'admin' || req.admin;
    
    // Admin can view all inventory, sellers need their own ID
    if (!sellerId && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID required',
      });
    }

    const { status, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Build query - admin sees all, seller sees only their own
    const query = {};
    if (sellerId && !isAdmin) {
      query.sellerId = sellerId;
    } else if (sellerId && isAdmin) {
      // Admin can filter by specific seller if needed
      query.sellerId = sellerId;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    let inventory = await Inventory.find(query)
      .populate('productId', 'name images category')
      .populate('sellerId', 'shopName businessDetails')
      .populate('warehouse', 'name location')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Search filter
    if (search) {
      inventory = inventory.filter(item => 
        item.sku.toLowerCase().includes(search.toLowerCase()) ||
        item.productId?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = await Inventory.countDocuments(query);

    // Calculate stats - for admin use query (all/filtered), for seller use sellerId
    const statsQuery = isAdmin && !sellerId ? {} : query;
    const stats = {
      total: total,
      inStock: await Inventory.countDocuments({ ...statsQuery, status: 'in-stock' }),
      lowStock: await Inventory.countDocuments({ ...statsQuery, status: 'low-stock' }),
      outOfStock: await Inventory.countDocuments({ ...statsQuery, status: 'out-of-stock' }),
      totalValue: inventory.reduce((sum, item) => sum + (item.stock.total * (item.productId?.price || 0)), 0),
    };

    res.status(200).json({
      success: true,
      data: {
        inventory,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory',
      error: error.message,
    });
  }
};

/**
 * Get single inventory item
 * @route GET /api/v1/inventory/:id
 */
exports.getInventoryById = async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('productId')
      .populate('warehouse')
      .populate('stockHistory.updatedBy', 'name email');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error('Get inventory by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory item',
      error: error.message,
    });
  }
};

/**
 * Create new inventory item
 * @route POST /api/v1/inventory
 */
exports.createInventory = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.body.sellerId;
    
    const inventoryData = {
      ...req.body,
      sellerId,
    };

    const inventory = await Inventory.create(inventoryData);

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: inventory,
    });
  } catch (error) {
    console.error('Create inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create inventory item',
      error: error.message,
    });
  }
};

/**
 * Update inventory stock
 * @route PUT /api/v1/inventory/:id/stock
 */
exports.updateStock = async (req, res) => {
  try {
    const { quantity, type, reason } = req.body;
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    // Update stock based on type
    switch (type) {
      case 'addition':
        inventory.stock.available += quantity;
        inventory.lastRestocked = new Date();
        break;
      case 'sale':
        inventory.stock.available -= quantity;
        break;
      case 'return':
        inventory.stock.available += quantity;
        break;
      case 'damage':
        inventory.stock.available -= quantity;
        inventory.stock.damaged += quantity;
        break;
      case 'adjustment':
        inventory.stock.available = quantity;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid stock update type',
        });
    }

    // Add to history
    inventory.stockHistory.push({
      type,
      quantity,
      reason,
      updatedBy: req.user?._id,
    });

    await inventory.save();

    res.status(200).json({
      success: true,
      message: 'Stock updated successfully',
      data: inventory,
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message,
    });
  }
};

/**
 * Update inventory item
 * @route PUT /api/v1/inventory/:id
 */
exports.updateInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory,
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory',
      error: error.message,
    });
  }
};

/**
 * Delete inventory item
 * @route DELETE /api/v1/inventory/:id
 */
exports.deleteInventory = async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully',
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item',
      error: error.message,
    });
  }
};

/**
 * Get low stock items
 * @route GET /api/v1/inventory/alerts/low-stock
 */
exports.getLowStockItems = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;

    const lowStockItems = await Inventory.find({
      sellerId,
      status: { $in: ['low-stock', 'out-of-stock'] },
    })
      .populate('productId', 'name images price')
      .sort({ 'stock.available': 1 });

    res.status(200).json({
      success: true,
      data: lowStockItems,
      count: lowStockItems.length,
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock items',
      error: error.message,
    });
  }
};

/**
 * Bulk stock update
 * @route POST /api/v1/inventory/bulk-update
 */
exports.bulkStockUpdate = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, quantity, type, reason }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Updates array is required',
      });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const update of updates) {
      try {
        const inventory = await Inventory.findById(update.id);
        
        if (!inventory) {
          results.failed.push({
            id: update.id,
            error: 'Inventory item not found',
          });
          continue;
        }

        // Update stock
        switch (update.type) {
          case 'addition':
            inventory.stock.available += update.quantity;
            break;
          case 'sale':
            inventory.stock.available -= update.quantity;
            break;
          case 'adjustment':
            inventory.stock.available = update.quantity;
            break;
        }

        inventory.stockHistory.push({
          type: update.type,
          quantity: update.quantity,
          reason: update.reason || 'Bulk update',
          updatedBy: req.user?._id,
        });

        await inventory.save();
        results.success.push(update.id);
      } catch (err) {
        results.failed.push({
          id: update.id,
          error: err.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk update completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
      data: results,
    });
  } catch (error) {
    console.error('Bulk stock update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk stock update',
      error: error.message,
    });
  }
};
