const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory data store for demo purposes
let items = [];
let nextId = 1;

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Misho Backend is running' });
});

// Get all items
app.get('/api/items', (req, res) => {
  res.json({ success: true, data: items });
});

// Get item by ID
app.get('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const item = items.find(i => i.id === id);
  
  if (!item) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  
  res.json({ success: true, data: item });
});

// Create new item
app.post('/api/items', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  
  const newItem = {
    id: nextId++,
    name,
    description: description || '',
    createdAt: new Date().toISOString()
  };
  
  items.push(newItem);
  res.status(201).json({ success: true, data: newItem });
});

// Update item
app.put('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description } = req.body;
  const itemIndex = items.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  
  if (name) items[itemIndex].name = name;
  if (description !== undefined) items[itemIndex].description = description;
  items[itemIndex].updatedAt = new Date().toISOString();
  
  res.json({ success: true, data: items[itemIndex] });
});

// Delete item
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const itemIndex = items.findIndex(i => i.id === id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: 'Item not found' });
  }
  
  const deletedItem = items.splice(itemIndex, 1)[0];
  res.json({ success: true, message: 'Item deleted', data: deletedItem });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Misho Backend server is running on port ${PORT}`);
});
