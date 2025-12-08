const mongoose = require('mongoose');
require('dotenv').config();

async function updateAllWallets() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const SellerWallet = require('./src/models/SellerWallet');
    const PayoutTransaction = require('./src/models/PayoutTransaction');
    const Seller = require('./src/models/Seller');
    const Order = require('./src/models/Order');
    
    // Get all sellers
    const sellers = await Seller.find();
    console.log(`\n📊 Found ${sellers.length} sellers\n`);
    
    for (const seller of sellers) {
      console.log(`\n--- Seller: ${seller.businessName || seller.email} ---`);
      console.log(`Seller ID: ${seller._id}`);
      
      // Get orders for this seller
      const orders = await Order.find({
        'items.seller': seller._id,
        status: 'delivered'
      });
      
      console.log(`Orders: ${orders.length}`);
      
      if (orders.length > 0) {
        // Get or create wallet
        const wallet = await SellerWallet.getOrCreate(seller._id);
        
        console.log('Before update:', {
          pending: wallet.pendingAmount,
          upcoming: wallet.upcomingPayout,
          completed: wallet.completedPayout,
          total: wallet.totalEarnings
        });
        
        // Update wallet
        await wallet.updateFromOrders();
        
        console.log('After update:', {
          pending: wallet.pendingAmount,
          upcoming: wallet.upcomingPayout,
          completed: wallet.completedPayout,
          total: wallet.totalEarnings
        });
      }
    }
    
    console.log('\n✅ All wallets updated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateAllWallets();
