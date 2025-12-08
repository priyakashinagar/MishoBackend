const mongoose = require('mongoose');
require('dotenv').config();

async function makePayoutReady() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Order = require('./src/models/Order');
    
    // Set delivered date to 8 days ago (past the 7-day hold)
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    
    const order = await Order.findOneAndUpdate(
      { orderId: 'MEEMIR89C94847W' },
      { 
        deliveredAt: eightDaysAgo,
        'payout.scheduledDate': new Date() // Today
      },
      { new: true }
    );
    
    if (order) {
      console.log('✅ Order updated for payout testing');
      console.log('Order ID:', order.orderId);
      console.log('Delivered At:', order.deliveredAt);
      console.log('Payout Status:', order.payout.status);
      console.log('Payout Scheduled:', order.payout.scheduledDate);
      
      const daysSince = Math.floor((Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24));
      console.log('Days since delivery:', daysSince);
      console.log('Ready for payout:', daysSince >= 7 ? 'YES ✓' : 'NO');
    } else {
      console.log('❌ Order not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makePayoutReady();
