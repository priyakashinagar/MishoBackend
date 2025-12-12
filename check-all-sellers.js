/**
 * Check all sellers and their data in database
 */

const mongoose = require('mongoose');
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
require('dotenv').config();

async function checkAllSellers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Get all sellers
    const sellers = await Seller.find().populate('user', 'name phone email');
    
    console.log('🏪 TOTAL SELLERS:', sellers.length);
    console.log('═'.repeat(80));
    console.log('');

    for (let i = 0; i < sellers.length; i++) {
      const seller = sellers[i];
      
      console.log(`${i + 1}. SELLER: ${seller.shopName}`);
      console.log('─'.repeat(80));
      console.log('   Seller ID:', seller._id.toString());
      console.log('   User Phone:', seller.user?.phone || 'N/A');
      console.log('   User Name:', seller.user?.name || 'N/A');
      console.log('   Shop Name:', seller.shopName);
      console.log('   Business Type:', seller.businessType);
      console.log('   KYC Status:', seller.kycStatus);
      console.log('   Is Verified:', seller.isVerified);
      console.log('   Created:', seller.createdAt.toLocaleDateString());
      
      // Check products
      const products = await Product.find({ seller: seller._id });
      console.log('');
      console.log('   📦 PRODUCTS:', products.length);
      if (products.length > 0) {
        products.slice(0, 3).forEach((p, idx) => {
          console.log(`      ${idx + 1}. ${p.name} - ₹${p.price} (Stock: ${p.stock?.quantity || 0})`);
        });
        if (products.length > 3) {
          console.log(`      ... and ${products.length - 3} more products`);
        }
      }
      
      // Check orders
      const orders = await Order.find({ 'items.seller': seller._id });
      console.log('');
      console.log('   📋 ORDERS:', orders.length);
      if (orders.length > 0) {
        const delivered = orders.filter(o => o.status === 'delivered').length;
        const pending = orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)).length;
        const totalRevenue = orders
          .filter(o => o.status === 'delivered')
          .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);
        
        console.log('      - Delivered:', delivered);
        console.log('      - Pending:', pending);
        console.log('      - Total Revenue: ₹' + totalRevenue.toFixed(2));
      }
      
      console.log('');
      console.log('═'.repeat(80));
      console.log('');
    }

    // Summary
    console.log('📊 SUMMARY:');
    console.log('─'.repeat(80));
    const sellersWithProducts = await Promise.all(
      sellers.map(async (s) => {
        const count = await Product.countDocuments({ seller: s._id });
        return { seller: s, count };
      })
    );
    
    const sellersWithData = sellersWithProducts.filter(s => s.count > 0);
    
    if (sellersWithData.length > 0) {
      console.log('✅ Sellers with Products:');
      sellersWithData.forEach(({ seller, count }) => {
        console.log(`   - ${seller.shopName} (${seller.user?.phone}): ${count} products`);
      });
    } else {
      console.log('⚠️ No sellers have products yet');
    }

    await mongoose.connection.close();
    console.log('\n📦 Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllSellers();
