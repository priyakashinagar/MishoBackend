/**
 * Populate Admin Panel Data - Create comprehensive test data
 * This script creates data that admin can view and manage
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Category = require('./src/models/Category');

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Get existing users and sellers
    const users = await User.find().limit(5);
    const sellers = await Seller.find().limit(5);
    const categories = await Category.find().limit(3);
    
    console.log(`📊 Found ${users.length} users, ${sellers.length} sellers, ${categories.length} categories\n`);

    if (users.length === 0 || sellers.length === 0) {
      console.log('❌ Need at least 1 user and 1 seller. Please run user/seller creation scripts first.');
      process.exit(1);
    }

    // CREATE ORDERS for admin to manage
    console.log('🛒 Creating Orders for admin dashboard...');
    
    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentMethods = ['cod', 'upi', 'card', 'wallet'];
    
    // Get some products
    const products = await Product.find().limit(10);
    
    if (products.length === 0) {
      console.log('⚠️ No products found. Orders will be created without product references.');
    }

    const ordersToCreate = [];
    
    for (let i = 0; i < 15; i++) {
      const user = users[i % users.length];
      const seller = sellers[i % sellers.length];
      const product = products.length > 0 ? products[i % products.length] : null;
      const status = orderStatuses[i % orderStatuses.length];
      
      const orderData = {
        user: user._id,
        seller: seller._id,
        orderNumber: `ORD-${Date.now()}-${i}`,
        items: product ? [{
          product: product._id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: product.price || 500,
          size: 'M',
          color: 'Red'
        }] : [],
        totalAmount: product ? (product.price || 500) * Math.floor(Math.random() * 3 + 1) : 1500,
        shippingAddress: {
          fullName: user.name || 'Test User',
          phone: user.phone || '9876543210',
          addressLine1: `${i + 1} Main Street`,
          city: ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Chennai'][i % 5],
          state: ['Maharashtra', 'Delhi', 'Karnataka', 'Maharashtra', 'Tamil Nadu'][i % 5],
          pincode: `40000${i}`,
          country: 'India'
        },
        paymentMethod: paymentMethods[i % paymentMethods.length],
        paymentStatus: status === 'delivered' ? 'completed' : 
                       status === 'cancelled' ? 'refunded' : 
                       status === 'confirmed' ? 'pending' : 'pending',
        status: status,
        placedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      };

      // Add delivery date for delivered orders
      if (status === 'delivered') {
        orderData.deliveredAt = new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000);
      }

      // Add shipped date for shipped/delivered orders
      if (['shipped', 'delivered'].includes(status)) {
        orderData.shippedAt = new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000);
      }

      ordersToCreate.push(orderData);
    }

    // Clear old test orders (optional - comment if you want to keep existing)
    const testOrderCount = await Order.countDocuments({ orderNumber: /^ORD-/ });
    if (testOrderCount > 0) {
      console.log(`  Clearing ${testOrderCount} old test orders...`);
      await Order.deleteMany({ orderNumber: /^ORD-/ });
    }

    // Create orders
    const createdOrders = await Order.insertMany(ordersToCreate);
    console.log(`  ✓ Created ${createdOrders.length} orders`);
    
    // Count by status
    const statusCounts = {};
    createdOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    console.log('  Order Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`    - ${status}: ${count}`);
    });

    // UPDATE USER ACTIVITY
    console.log('\n👥 Updating user activity...');
    for (const user of users) {
      user.lastLoginAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
      await user.save();
    }
    console.log(`  ✓ Updated ${users.length} users`);

    // UPDATE SELLER VERIFICATION STATUS
    console.log('\n🏪 Updating seller verification status...');
    const verificationStatuses = ['pending', 'verified', 'rejected', 'under-review'];
    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      seller.isVerified = i < 3; // First 3 verified
      seller.verificationStatus = verificationStatuses[i % verificationStatuses.length];
      await seller.save();
    }
    console.log(`  ✓ Updated ${sellers.length} sellers`);

    // CALCULATE STATISTICS
    console.log('\n📈 Calculating Statistics...');
    
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'shipped', 'processing'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalProducts = await Product.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalSellers = await Seller.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    console.log('\n' + '='.repeat(60));
    console.log('✅ ADMIN DASHBOARD DATA READY!');
    console.log('='.repeat(60));
    console.log('\n📊 Statistics Overview:');
    console.log(`  • Total Users: ${totalUsers}`);
    console.log(`  • Total Sellers: ${totalSellers}`);
    console.log(`  • Total Products: ${totalProducts}`);
    console.log(`  • Total Orders: ${totalOrders}`);
    console.log(`  • Pending Orders: ${pendingOrders}`);
    console.log(`  • Delivered Orders: ${deliveredOrders}`);
    console.log(`  • Total Revenue: ₹${totalRevenue[0]?.total || 0}`);

    console.log('\n📋 Admin Panel Pages Ready:');
    console.log('  ✓ Dashboard - Shows stats and recent orders');
    console.log('  ✓ Orders - Manage all orders (15 test orders)');
    console.log('  ✓ Users - View and manage users');
    console.log('  ✓ Sellers - Verify and manage sellers');
    console.log('  ✓ Products - View all products');
    console.log('  ✓ Returns - Handle return requests');
    console.log('  ✓ Payments - Track payment transactions');
    console.log('  ✓ Analytics - View business insights');

    console.log('\n🚀 Next Steps:');
    console.log('  1. Login to Admin Panel');
    console.log('  2. Check Dashboard for overview');
    console.log('  3. Navigate to Orders to see test orders');
    console.log('  4. Verify sellers from Sellers page');
    console.log('  5. Manage users and products\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
    process.exit(0);
  }
}

main();
