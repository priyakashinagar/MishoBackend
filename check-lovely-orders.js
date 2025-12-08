require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const orders = await Order.find({ 'items.seller': '69315198fc205813950427f4' })
    .populate('items.product', 'name')
    .select('orderId status items');
  
  console.log('🏪 lovelyStore Orders:\n');
  
  if (orders.length === 0) {
    console.log('No orders found');
  } else {
    orders.forEach(o => {
      console.log(`📦 Order: ${o.orderId}`);
      console.log(`   Status: ${o.status}`);
      console.log(`   Products: ${o.items.map(i => i.product?.name || 'N/A').join(', ')}\n`);
    });
  }
  
  await mongoose.connection.close();
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
