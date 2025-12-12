const mongoose = require('mongoose');
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const seller = await Seller.findOne({ shopName: 'lovelyStore' }).populate('user', 'phone name');
  const products = await Product.find({ seller: seller._id });
  const orders = await Order.find({ 'items.seller': seller._id });
  
  console.log('🎉 FINAL VERIFICATION:\n');
  console.log('📞 Login Phone:', seller.user.phone);
  console.log('🏪 Shop Name:', seller.shopName);
  console.log('📦 Products:', products.length);
  products.forEach((p, i) => console.log(`   ${i+1}. ${p.name} - ₹${p.price} (Stock: ${p.stock?.quantity})`));
  console.log('📋 Orders:', orders.length);
  const delivered = orders.filter(o => o.status === 'delivered');
  console.log('   Delivered:', delivered.length);
  console.log('   Revenue: ₹' + delivered.reduce((sum, o) => sum + (o.pricing?.total || 0), 0));
  
  await mongoose.connection.close();
}).catch(err => console.error(err));
