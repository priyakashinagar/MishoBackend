/**
 * Test script to verify login flow for 9666777888
 */

const mongoose = require('mongoose');
const User = require('./src/models/User');
const Seller = require('./src/models/Seller');
require('dotenv').config();

async function testLoginFlow() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    const phone = '9666777888';
    
    // Step 1: Find user
    console.log('1️⃣ Finding user with phone:', phone);
    const user = await User.findOne({ phone });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log('   - ID:', user._id.toString());
    console.log('   - Name:', user.name);
    console.log('   - Role:', user.role);
    console.log('   - Phone Verified:', user.isPhoneVerified);
    console.log('');

    // Step 2: Find seller profile
    if (user.role === 'seller') {
      console.log('2️⃣ Finding seller profile...');
      const seller = await Seller.findOne({ user: user._id });
      
      if (!seller) {
        console.log('❌ No seller profile found');
        console.log('📝 Result: requiresOnboarding = true');
      } else {
        console.log('✅ Seller profile found:');
        console.log('   - Seller ID:', seller._id.toString());
        console.log('   - Shop Name:', seller.shopName);
        console.log('   - Business Type:', seller.businessType);
        console.log('   - Address Line 1:', seller.businessAddress?.addressLine1 || 'Not set');
        console.log('   - City:', seller.businessAddress?.city || 'Not set');
        console.log('   - State:', seller.businessAddress?.state || 'Not set');
        console.log('   - Pincode:', seller.businessAddress?.pincode || 'Not set');
        console.log('');

        // Step 3: Check profile completeness
        console.log('3️⃣ Checking profile completeness...');
        
        const hasShopName = seller.shopName && 
                           seller.shopName !== 'My Store' && 
                           seller.shopName.toLowerCase() !== 'my store' &&
                           seller.shopName.trim() !== '';
        
        const hasAddress = seller.businessAddress && 
                          seller.businessAddress.addressLine1 && 
                          seller.businessAddress.addressLine1 !== 'Address' &&
                          seller.businessAddress.addressLine1.trim() !== '';
        
        console.log('   - Has valid shop name:', hasShopName, '(', seller.shopName, ')');
        console.log('   - Has valid address:', hasAddress, '(', seller.businessAddress?.addressLine1 || 'None', ')');
        console.log('');

        // Step 4: Determine requiresOnboarding
        const requiresOnboarding = !(hasShopName && hasAddress);
        
        console.log('4️⃣ FINAL RESULT:');
        if (requiresOnboarding) {
          console.log('   ⚠️ requiresOnboarding = true');
          console.log('   👉 User will be redirected to /seller-register');
        } else {
          console.log('   ✅ requiresOnboarding = false');
          console.log('   👉 User will be redirected to /seller (dashboard)');
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n📦 Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLoginFlow();
