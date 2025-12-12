/**
 * Check and delete duplicate seller profiles
 */

const mongoose = require('mongoose');
const Seller = require('./src/models/Seller');
require('dotenv').config();

async function checkAndDeleteDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    const userId = '69368bb346b317e5f061342b';
    
    // Find all seller profiles for this user
    const sellers = await Seller.find({ user: userId }).sort({ createdAt: 1 });
    
    console.log('📊 Total Seller Profiles:', sellers.length);
    console.log('');
    
    sellers.forEach((s, i) => {
      console.log(`${i+1}. Seller Profile:`);
      console.log('   ID:', s._id.toString());
      console.log('   Shop Name:', s.shopName);
      console.log('   Created:', s.createdAt);
      console.log('   Updated:', s.updatedAt);
      console.log('   Address:', s.businessAddress?.addressLine1 || 'Not set');
      console.log('   City:', s.businessAddress?.city || 'Not set');
      console.log('');
    });

    if (sellers.length > 1) {
      console.log('⚠️ Multiple profiles found! Keeping the FIRST one (lovelystore)');
      console.log('');
      
      // Keep first (oldest), delete rest
      const toKeep = sellers[0];
      const toDelete = sellers.slice(1);
      
      console.log('✅ KEEPING:');
      console.log('   ID:', toKeep._id.toString());
      console.log('   Shop Name:', toKeep.shopName);
      console.log('   Created:', toKeep.createdAt);
      console.log('');
      
      console.log('🗑️ DELETING:');
      for (const seller of toDelete) {
        console.log('   ID:', seller._id.toString());
        console.log('   Shop Name:', seller.shopName);
        console.log('   Created:', seller.createdAt);
        
        // Delete the duplicate
        await Seller.findByIdAndDelete(seller._id);
        console.log('   ✅ Deleted');
        console.log('');
      }
      
      console.log('✅ Cleanup complete!');
    } else {
      console.log('✅ Only one profile found. No duplicates to delete.');
    }

    await mongoose.connection.close();
    console.log('\n📦 Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAndDeleteDuplicates();
