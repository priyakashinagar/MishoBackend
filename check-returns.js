/**
 * Check returns in database
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Seller = require('./src/models/Seller');

const checkReturns = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all sellers
    const sellers = await Seller.find().select('_id shopName user');
    console.log('\n📊 Total Sellers:', sellers.length);
    
    for (const seller of sellers) {
      console.log(`\n🏪 Seller: ${seller.shopName} (ID: ${seller._id})`);
      
      // Count orders by status
      const allOrders = await Order.countDocuments({ 'items.seller': seller._id });
      const deliveredOrders = await Order.countDocuments({ 'items.seller': seller._id, status: 'delivered' });
      const returnRequested = await Order.countDocuments({ 'items.seller': seller._id, status: 'return_requested' });
      const returnApproved = await Order.countDocuments({ 'items.seller': seller._id, status: 'return_approved' });
      const returnRejected = await Order.countDocuments({ 'items.seller': seller._id, status: 'return_rejected' });
      const returned = await Order.countDocuments({ 'items.seller': seller._id, status: 'returned' });
      
      console.log(`  📦 Total Orders: ${allOrders}`);
      console.log(`  ✅ Delivered: ${deliveredOrders}`);
      console.log(`  🔄 Return Requested: ${returnRequested}`);
      console.log(`  ✔️ Return Approved: ${returnApproved}`);
      console.log(`  ❌ Return Rejected: ${returnRejected}`);
      console.log(`  💰 Returned: ${returned}`);
      
      // Show sample return orders
      if (returnRequested > 0 || returnApproved > 0 || returnRejected > 0 || returned > 0) {
        const returnOrders = await Order.find({ 
          'items.seller': seller._id,
          status: { $in: ['return_requested', 'return_approved', 'return_rejected', 'returned'] }
        })
        .populate('user', 'name phone')
        .populate('items.product', 'name')
        .limit(5);
        
        console.log('\n  📋 Return Orders:');
        returnOrders.forEach(order => {
          console.log(`    - Order ${order.orderId} | Status: ${order.status} | Customer: ${order.user?.name || 'N/A'}`);
          console.log(`      Reason: ${order.returnReason || 'Not specified'}`);
          console.log(`      Products: ${order.items.map(i => i.product?.name || 'N/A').join(', ')}`);
        });
      }
    }
    
    // Check all return orders across all sellers
    console.log('\n\n📊 OVERALL RETURN STATISTICS:');
    const totalReturns = await Order.countDocuments({ 
      status: { $in: ['return_requested', 'return_approved', 'return_rejected', 'returned'] }
    });
    console.log(`Total Return Orders: ${totalReturns}`);
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkReturns();
