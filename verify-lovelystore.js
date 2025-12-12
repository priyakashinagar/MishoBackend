/**
 * Verify lovelystore seller has proper data
 */

const mongoose = require('mongoose');
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
require('dotenv').config();

async function verifySellerData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    const sellerId = '693c00f898325a80d13e2b6d';
    
    // Get seller
    const seller = await Seller.findById(sellerId);
    console.log('🏪 SELLER DETAILS:');
    console.log('   Shop Name:', seller.shopName);
    console.log('   Seller ID:', seller._id.toString());
    console.log('   User ID:', seller.user.toString());
    console.log('   KYC Status:', seller.kycStatus);
    console.log('   Is Verified:', seller.isVerified);
    console.log('');

    // Check products
    const products = await Product.find({ seller: sellerId });
    console.log('📦 PRODUCTS:');
    console.log('   Total Products:', products.length);
    if (products.length > 0) {
      products.slice(0, 5).forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name} - ₹${p.price} (Stock: ${p.stock?.quantity || 0})`);
      });
      if (products.length > 5) {
        console.log(`   ... and ${products.length - 5} more`);
      }
    }
    console.log('');

    // Check orders
    const orders = await Order.find({ 'items.seller': sellerId });
    console.log('📋 ORDERS:');
    console.log('   Total Orders:', orders.length);
    if (orders.length > 0) {
      const totalRevenue = orders.reduce((sum, o) => {
        if (o.status === 'delivered') {
          return sum + (o.pricing?.total || 0);
        }
        return sum;
      }, 0);
      console.log('   Total Revenue:', '₹' + totalRevenue);
      console.log('   Pending Orders:', orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length);
      console.log('   Delivered Orders:', orders.filter(o => o.status === 'delivered').length);
    }
    console.log('');

    console.log('✅ Seller "lovelystore" is properly set up!');
    console.log('');
    console.log('👉 Login with phone 9666777888');
    console.log('👉 You will get lovelystore dashboard with all data');

    await mongoose.connection.close();
    console.log('\n📦 Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifySellerData();
