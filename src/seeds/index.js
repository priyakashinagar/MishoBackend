/**
 * Database Seeder - Run all seeders
 */

require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const seedCategories = require('./categorySeeder');
const seedSeller = require('./sellerSeeder');
const seedProducts = require('./productSeeder');

async function runSeeders() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding');

    // Run seeders in order
    await seedCategories();
    await seedSeller();
    await seedProducts();

    logger.info('All seeders completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeders
runSeeders();
