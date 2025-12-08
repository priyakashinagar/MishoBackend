require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Find the delivered order
  const order = await Order.findOne({ 
    orderId: 'MEEMIR89C94847W',
    'items.seller': '69315198fc205813950427f4'
  });
  
  if (!order) {
    console.log('❌ Order not found');
    await mongoose.connection.close();
    return;
  }
  
  console.log('📦 Before Return Request:');
  console.log(`   Order: ${order.orderId}`);
  console.log(`   Status: ${order.status}`);
  
  // Submit return request
  order.status = 'return_requested';
  order.returnReason = 'Product defective - testing return feature';
  order.returnRequest = {
    requested: true,
    reason: 'Product defective - testing return feature',
    status: 'pending',
    requestedAt: new Date()
  };
  await order.save();
  
  console.log('\n✅ After Return Request:');
  console.log(`   Order: ${order.orderId}`);
  console.log(`   Status: ${order.status}`);
  console.log(`   Return Reason: ${order.returnReason}`);
  console.log(`   Requested At: ${order.returnRequest.requestedAt}`);
  
  await mongoose.connection.close();
  console.log('\n✅ Return request submitted successfully!');
  console.log('📍 Now check Seller Panel > Returns section');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
