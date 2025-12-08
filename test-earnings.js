/**
 * Script to mark an order as delivered and test earning calculation
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Order = require('./src/models/Order');
const SellerWallet = require('./src/models/SellerWallet');
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const PayoutTransaction = require('./src/models/PayoutTransaction');

async function markOrderDelivered() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find lovelyStore seller
    const seller = await Seller.findOne({ shopName: 'lovelyStore' });
    if (!seller) {
      console.log('❌ lovelyStore seller not found');
      return;
    }
    console.log('🏪 Found seller:', seller.shopName, seller._id);

    // Find the return_approved order
    const order = await Order.findOne({ 
      orderId: 'MEEMIR89C94847W'
    }).populate('items.product');
    
    if (!order) {
      console.log('❌ Order MEEMIR89C94847W not found');
      return;
    }

    console.log('\n📦 Order Details:');
    console.log('   Order ID:', order.orderId);
    console.log('   Current Status:', order.status);
    console.log('   Product Price:', order.pricing.itemsTotal);
    console.log('   Total Amount:', order.pricing.total);

    // Mark as delivered
    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.payment.status = 'completed';
    
    // Calculate earnings
    console.log('\n💰 Calculating earnings...');
    await order.calculateSellerEarnings();
    await order.save();

    console.log('\n✅ Order marked as delivered!');
    console.log('\n📊 Earnings Breakdown:');
    console.log('   Product Price:', `₹${order.pricing.itemsTotal}`);
    console.log('   Commission %:', `${order.earnings.commissionPercent}%`);
    console.log('   Platform Commission:', `-₹${order.earnings.platformCommission}`);
    console.log('   CGST (9%):', `-₹${order.earnings.cgst}`);
    console.log('   SGST (9%):', `-₹${order.earnings.sgst}`);
    console.log('   Total GST:', `-₹${order.earnings.totalTax}`);
    console.log('   Shipping:', `-₹${order.earnings.shippingCharges}`);
    console.log('   Net Seller Earning:', `₹${order.earnings.netSellerEarning}`);
    console.log('   Payout Status:', order.payout.status);
    console.log('   Scheduled Date:', order.payout.scheduledDate);

    // Update wallet
    console.log('\n💳 Updating seller wallet...');
    let wallet = await SellerWallet.getOrCreate(seller._id);
    await wallet.updateFromOrders();
    wallet = await SellerWallet.findOne({ seller: seller._id });

    console.log('\n💰 Wallet Summary:');
    console.log('   Pending Amount:', `₹${wallet.pendingAmount}`);
    console.log('   Upcoming Payout:', `₹${wallet.upcomingPayout}`);
    console.log('   Completed Payout:', `₹${wallet.completedPayout}`);
    console.log('   Total Earnings:', `₹${wallet.totalEarnings}`);

    console.log('\n✅ Test completed successfully!');
    console.log('\n🔍 Now check the Earnings page in seller panel');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

markOrderDelivered();
