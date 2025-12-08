const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./src/models/Order');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB\n');
    
    const sellerId = '69315198fc205813950427f4';
    const orders = await Order.find({ 'items.seller': sellerId }).lean();
    
    console.log('Total Orders:', orders.length);
    
    orders.forEach(order => {
      console.log('\n📦 Order:', order.orderNumber);
      console.log('   Status:', order.status);
      console.log('   Pricing Total:', order.pricing?.total);
      console.log('   Items Total:', order.pricing?.itemsTotal);
      console.log('   Earnings:', order.earnings?.netSellerEarning);
      console.log('   Commission:', order.earnings?.platformCommission);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
