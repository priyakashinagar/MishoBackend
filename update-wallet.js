const mongoose = require('mongoose');
require('dotenv').config();

async function updateWallet() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const SellerWallet = require('./src/models/SellerWallet');
    const Order = require('./src/models/Order');
    const PayoutTransaction = require('./src/models/PayoutTransaction'); // Import this too
    
    // Find the order
    const order = await Order.findOne({ orderId: 'MEEMIR89C94847W' });
    
    if (!order) {
      console.log('❌ Order not found');
      process.exit(1);
    }
    
    console.log('\n📦 Order Details:');
    console.log('Order ID:', order.orderId);
    console.log('Seller ID:', order.items[0]?.seller);
    console.log('Status:', order.status);
    console.log('Payout Status:', order.payout?.status);
    console.log('Net Earning:', order.earnings?.netSellerEarning);
    console.log('Delivered At:', order.deliveredAt);
    
    // Update wallet for this seller
    const sellerId = order.items[0]?.seller;
    if (!sellerId) {
      console.log('❌ Seller ID not found in order');
      process.exit(1);
    }
    
    const wallet = await SellerWallet.getOrCreate(sellerId);
    console.log('\n💰 Wallet BEFORE update:');
    console.log('Pending:', wallet.pendingAmount);
    console.log('Upcoming:', wallet.upcomingPayout);
    console.log('Completed:', wallet.completedPayout);
    console.log('Total:', wallet.totalEarnings);
    
    // Update from orders
    await wallet.updateFromOrders();
    
    console.log('\n💰 Wallet AFTER update:');
    console.log('Pending:', wallet.pendingAmount);
    console.log('Upcoming:', wallet.upcomingPayout);
    console.log('Completed:', wallet.completedPayout);
    console.log('Total:', wallet.totalEarnings);
    
    // Check pending payouts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const pendingOrders = await Order.find({
      'items.seller': sellerId,
      status: 'delivered',
      'payout.status': 'pending',
      deliveredAt: { $lte: sevenDaysAgo }
    });
    
    console.log('\n📋 Orders Ready for Payout:');
    console.log('Count:', pendingOrders.length);
    if (pendingOrders.length > 0) {
      pendingOrders.forEach(o => {
        console.log(`  - ${o.orderId}: ₹${o.earnings.netSellerEarning} (delivered ${o.deliveredAt.toLocaleDateString()})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateWallet();
