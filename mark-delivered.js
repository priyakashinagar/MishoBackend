require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Find the confirmed order
  const order = await Order.findOne({ 
    orderId: 'MEEMIR89C94847W',
    'items.seller': '69315198fc205813950427f4'
  });
  
  if (!order) {
    console.log('❌ Order not found');
    await mongoose.connection.close();
    return;
  }
  
  console.log('📦 Before Update:');
  console.log(`   Order: ${order.orderId}`);
  console.log(`   Status: ${order.status}`);
  
  // Update to delivered
  order.status = 'delivered';
  order.deliveredAt = new Date();
  await order.save();
  
  console.log('\n✅ After Update:');
  console.log(`   Order: ${order.orderId}`);
  console.log(`   Status: ${order.status}`);
  console.log(`   Delivered At: ${order.deliveredAt}`);
  
  await mongoose.connection.close();
  console.log('\n✅ Order marked as delivered!');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
