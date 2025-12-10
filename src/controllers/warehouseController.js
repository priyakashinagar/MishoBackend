/**
 * @fileoverview Warehouse Controller
 */

const Warehouse = require('../models/Warehouse');

exports.getAllWarehouses = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;
    const { status } = req.query;

    const query = { sellerId };
    if (status && status !== 'all') query.status = status;

    const warehouses = await Warehouse.find(query).sort({ createdAt: -1 });
    const stats = {
      total: warehouses.length,
      active: warehouses.filter(w => w.status === 'active').length,
      totalCapacity: warehouses.reduce((sum, w) => sum + w.capacity.total, 0),
      availableCapacity: warehouses.reduce((sum, w) => sum + w.capacity.available, 0),
    };

    res.status(200).json({ success: true, data: { warehouses, stats } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch warehouses', error: error.message });
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch warehouse', error: error.message });
  }
};

exports.createWarehouse = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.body.sellerId;
    const warehouse = await Warehouse.create({ ...req.body, sellerId });
    res.status(201).json({ success: true, message: 'Warehouse created successfully', data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create warehouse', error: error.message });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.status(200).json({ success: true, message: 'Warehouse updated successfully', data: warehouse });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update warehouse', error: error.message });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) return res.status(404).json({ success: false, message: 'Warehouse not found' });
    res.status(200).json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete warehouse', error: error.message });
  }
};
