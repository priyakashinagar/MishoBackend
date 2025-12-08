/**
 * Seller Seeder - Add sample seller
 */

const Seller = require('../models/Seller');
const User = require('../models/User');
const logger = require('../utils/logger');

async function seedSeller() {
  try {
    const existingSellers = await Seller.countDocuments();
    if (existingSellers > 0) {
      logger.info(`Database already has ${existingSellers} sellers. Skipping seed.`);
      return;
    }

    // Create a seller user first
    const existingUser = await User.findOne({ email: 'seller@meesho.com' });
    let sellerUser;
    
    if (!existingUser) {
      sellerUser = await User.create({
        name: 'Demo Seller',
        email: 'seller@meesho.com',
        password: 'Seller@123',
        phone: '9876543210',
        role: 'seller',
        isEmailVerified: true
      });
      logger.info('Created seller user');
    } else {
      sellerUser = existingUser;
      logger.info('Using existing seller user');
    }

    // Create seller profile
    const seller = await Seller.create({
      user: sellerUser._id,
      businessName: 'Demo Fashion Store',
      businessType: 'individual',
      gstin: 'DEMO123456789',
      pan: 'DEMOP1234A',
      address: {
        street: '123 Main Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      bankDetails: {
        accountName: 'Demo Seller',
        accountNumber: '1234567890',
        ifsc: 'DEMO0001234',
        bankName: 'Demo Bank'
      },
      status: 'approved'
    });

    logger.info('Successfully seeded seller');
    return seller;
  } catch (error) {
    logger.error('Error seeding seller:', error);
    throw error;
  }
}

module.exports = seedSeller;
