/**
 * Fix: Link lovelyStore (9777666888) to user 9666777888
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Seller = require('./src/models/Seller');
require('dotenv').config();

async function fixSellerLink() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Step 1: Find both users
    const user6 = await User.findOne({ phone: '9666777888' });
    const user7 = await User.findOne({ phone: '9777666888' });
    
    console.log('👤 USER 1 (9666777888):');
    console.log('   ID:', user6._id.toString());
    console.log('   Name:', user6.name);
    console.log('');
    
    console.log('👤 USER 2 (9777666888):');
    console.log('   ID:', user7._id.toString());
    console.log('   Name:', user7.name);
    console.log('');

    // Step 2: Find both sellers
    const seller6 = await Seller.findOne({ user: user6._id });
    const seller7 = await Seller.findOne({ user: user7._id });
    
    console.log('🏪 SELLER 1 (linked to 9666777888):');
    console.log('   ID:', seller6._id.toString());
    console.log('   Shop Name:', seller6.shopName);
    console.log('   Products:', (await require('./src/models/Product').countDocuments({ seller: seller6._id })));
    console.log('');
    
    console.log('🏪 SELLER 2 (linked to 9777666888):');
    console.log('   ID:', seller7._id.toString());
    console.log('   Shop Name:', seller7.shopName);
    const productCount = await require('./src/models/Product').countDocuments({ seller: seller7._id });
    console.log('   Products:', productCount);
    console.log('');

    console.log('🔄 FIXING:');
    console.log('   1. Deleting empty seller (lovelystore - 9666777888)');
    console.log('   2. Linking lovelyStore to user 9666777888');
    console.log('');

    // Step 3: Delete empty seller
    await Seller.findByIdAndDelete(seller6._id);
    console.log('   ✅ Deleted empty seller:', seller6._id.toString());

    // Step 4: Update lovelyStore to link with user 9666777888
    await Seller.findByIdAndUpdate(
      seller7._id,
      { user: user6._id },
      { new: true }
    );
    console.log('   ✅ Linked lovelyStore to user 9666777888');
    console.log('');

    // Step 5: Delete old user 9777666888 (optional)
    console.log('🗑️ CLEANUP:');
    console.log('   Do you want to delete user 9777666888? (Run separately if needed)');
    // await User.findByIdAndDelete(user7._id);
    console.log('   ⚠️ Keeping user 9777666888 for now (can delete manually)');
    console.log('');

    // Verify
    const updatedSeller = await Seller.findById(seller7._id).populate('user');
    console.log('✅ VERIFICATION:');
    console.log('   Shop Name:', updatedSeller.shopName);
    console.log('   Linked to Phone:', updatedSeller.user.phone);
    console.log('   Products:', productCount);
    console.log('');
    
    console.log('🎉 SUCCESS!');
    console.log('   Now login with: 9666777888');
    console.log('   You will get: lovelyStore dashboard with all products & orders');

    await mongoose.connection.close();
    console.log('\n📦 Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSellerLink();
