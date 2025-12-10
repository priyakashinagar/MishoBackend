/**
 * @fileoverview Support Controller
 */

const Support = require('../models/Support');

exports.getAllTickets = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.query.sellerId;
    const { status, category, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { sellerId };
    if (status && status !== 'all') query.status = status;
    if (category && category !== 'all') query.category = category;

    const tickets = await Support.find(query)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Support.countDocuments(query);
    const stats = {
      total,
      open: await Support.countDocuments({ sellerId, status: 'open' }),
      inProgress: await Support.countDocuments({ sellerId, status: 'in-progress' }),
      resolved: await Support.countDocuments({ sellerId, status: 'resolved' }),
    };

    res.status(200).json({
      success: true,
      data: { tickets, stats, pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      }},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tickets', error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Support.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email');
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch ticket', error: error.message });
  }
};

exports.createTicket = async (req, res) => {
  try {
    const sellerId = req.seller?._id || req.user?.seller?._id || req.body.sellerId;
    const ticketNumber = 'TKT' + Date.now();
    const ticket = await Support.create({ ...req.body, sellerId, ticketNumber });
    res.status(201).json({ success: true, message: 'Ticket created successfully', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create ticket', error: error.message });
  }
};

exports.addMessage = async (req, res) => {
  try {
    const { message, attachments } = req.body;
    const ticket = await Support.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });

    ticket.messages.push({
      sender: req.user?._id || req.seller?._id,
      message,
      attachments: attachments || [],
    });
    await ticket.save();

    res.status(200).json({ success: true, message: 'Message added successfully', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add message', error: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Support.findByIdAndUpdate(
      req.params.id,
      { status, resolvedAt: status === 'resolved' ? new Date() : undefined },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    res.status(200).json({ success: true, message: 'Ticket status updated', data: ticket });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update ticket', error: error.message });
  }
};
