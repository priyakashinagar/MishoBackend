/**
 * Check existing orders in database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Order = require('./src/models/Order');

async function checkOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    const totalOrders = await Order.countDocuments();
    console.log(`📦 Total orders in database: ${totalOrders}\n`);

    if (totalOrders > 0) {
      const orders = await Order.find()
        .populate('user', 'name email')
        .limit(5)
        .sort({ createdAt: -1 });

      console.log('Recent orders:');
      orders.forEach((order, i) => {
        console.log(`\n${i + 1}. Order ID: ${order.orderId || order._id}`);
        console.log(`   Customer: ${order.user?.name || 'N/A'} (${order.user?.email || 'N/A'})`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: ₹${order.pricing?.total || 0}`);
        console.log(`   Items: ${order.items?.length || 0}`);
        console.log(`   Created: ${order.createdAt}`);
      });
    } else {
      console.log('⚠️ No orders found in database!');
      console.log('\nTo create orders:');
      console.log('1. Go to user website: http://localhost:5173');
      console.log('2. Browse products and add to cart');
      console.log('3. Complete checkout process');
    }

    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkOrders();
