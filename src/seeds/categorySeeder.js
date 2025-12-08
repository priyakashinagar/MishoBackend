/**
 * Category Seeder - Add sample categories
 */

const Category = require('../models/Category');
const logger = require('../utils/logger');

const sampleCategories = [
  {
    name: 'Fashion',
    description: 'Clothing, Footwear, and Accessories',
    slug: 'fashion',
    isActive: true
  },
  {
    name: 'Electronics',
    description: 'Phones, Laptops, and Gadgets',
    slug: 'electronics',
    isActive: true
  },
  {
    name: 'Home & Kitchen',
    description: 'Home Decor, Kitchen Appliances',
    slug: 'home-kitchen',
    isActive: true
  },
  {
    name: 'Beauty & Health',
    description: 'Cosmetics, Skincare, and Health Products',
    slug: 'beauty-health',
    isActive: true
  }
];

async function seedCategories() {
  try {
    const existingCategories = await Category.countDocuments();
    if (existingCategories > 0) {
      logger.info(`Database already has ${existingCategories} categories. Skipping seed.`);
      return;
    }

    const result = await Category.insertMany(sampleCategories);
    logger.info(`Successfully seeded ${result.length} categories`);
    
    return result;
  } catch (error) {
    logger.error('Error seeding categories:', error);
    throw error;
  }
}

module.exports = seedCategories;
