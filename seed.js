/**
 * Database Seeder Script
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Seller = require('./src/models/Seller');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Seed Admin User
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ email: 'admin@meesho.com' });
    
    if (adminExists) {
      console.log('⚠️  Admin already exists');
      return adminExists;
    }

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@meesho.com',
      phone: '9999999999',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true
    });

    console.log('✅ Admin User Created');
    console.log('📧 Email: admin@meesho.com');
    console.log('🔑 Password: Admin@123');
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  }
};

// Seed Seller User
const seedSeller = async () => {
  try {
    const sellerUserExists = await User.findOne({ email: 'seller@meesho.com' });
    
    if (sellerUserExists) {
      console.log('⚠️  Seller user already exists');
      return sellerUserExists;
    }

    const sellerUser = await User.create({
      name: 'Seller User',
      email: 'seller@meesho.com',
      phone: '8888888888',
      password: 'Seller@123',
      role: 'seller',
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true
    });

    // Create seller profile
    const sellerProfile = await Seller.create({
      user: sellerUser._id,
      shopName: 'Seller Shop',
      businessType: 'proprietorship',
      description: 'Official Seller Account',
      businessAddress: {
        addressLine1: '123 Business Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      },
      kycStatus: 'approved',
      isVerified: true,
      isActive: true
    });

    console.log('✅ Seller User Created');
    console.log('📧 Email: seller@meesho.com');
    console.log('🔑 Password: Seller@123');
    console.log('🏪 Shop: Seller Shop');
    return { sellerUser, sellerProfile };
  } catch (error) {
    console.error('❌ Error creating seller:', error.message);
  }
};

// Main seeder function
const seedDatabase = async () => {
  await connectDB();
  
  console.log('\n🌱 Starting Database Seeding...\n');
  
  await seedAdmin();
  console.log('');
  await seedSeller();
  
  console.log('\n✅ Database Seeding Completed!\n');
  console.log('📝 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👨‍💼 Admin:');
  console.log('   Email: admin@meesho.com');
  console.log('   Password: Admin@123');
  console.log('');
  console.log('🏪 Seller:');
  console.log('   Email: seller@meesho.com');
  console.log('   Password: Seller@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  process.exit(0);
};

// Run seeder
seedDatabase().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
