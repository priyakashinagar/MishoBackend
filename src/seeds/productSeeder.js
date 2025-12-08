/**
 * Product Seeder - Add sample products to database
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Seller = require('../models/Seller');
const logger = require('../utils/logger');

const sampleProducts = [
  {
    name: "Women's Western Dress",
    description: "Stylish and comfortable western dress perfect for casual outings",
    price: 799,
    mrp: 2199,
    images: [{ public_id: 'product1', url: "https://images.meesho.com/images/products/1/1_512.jpg" }],
    stock: { quantity: 50, status: 'in_stock' }
  },
  {
    name: "New Pillow Covers Set of 5",
    description: "Premium quality pillow covers with beautiful designs",
    price: 207,
    mrp: 999,
    images: [{ public_id: 'product2', url: "https://images.meesho.com/images/products/2/2_512.jpg" }],
    stock: { quantity: 100, status: 'in_stock' }
  },
  {
    name: "Men's Cotton T-Shirt",
    description: "Comfortable cotton t-shirt for everyday wear",
    price: 299,
    mrp: 799,
    images: [{ public_id: 'product3', url: "https://images.meesho.com/images/products/3/3_512.jpg" }],
    stock: { quantity: 75, status: 'in_stock' }
  },
  {
    name: "Designer Saree",
    description: "Beautiful designer saree for special occasions",
    price: 1499,
    mrp: 3999,
    images: [{ public_id: 'product4', url: "https://images.meesho.com/images/products/4/4_512.jpg" }],
    stock: { quantity: 30, status: 'in_stock' }
  },
  {
    name: "Kids School Bag",
    description: "Durable and spacious school bag for kids",
    price: 399,
    mrp: 999,
    images: [{ public_id: 'product5', url: "https://images.meesho.com/images/products/5/5_512.jpg" }],
    stock: { quantity: 60, status: 'in_stock' }
  },
  {
    name: "Kitchen Utensils Set",
    description: "Complete kitchen utensils set of 10 pieces",
    price: 599,
    mrp: 1499,
    images: [{ public_id: 'product6', url: "https://images.meesho.com/images/products/6/6_512.jpg" }],
    stock: { quantity: 40, status: 'in_stock' }
  },
  {
    name: "Bluetooth Earphones",
    description: "Wireless bluetooth earphones with mic",
    price: 499,
    mrp: 1999,
    images: [{ public_id: 'product7', url: "https://images.meesho.com/images/products/7/7_512.jpg" }],
    stock: { quantity: 80, status: 'in_stock' }
  },
  {
    name: "Women's Handbag",
    description: "Trendy handbag perfect for daily use",
    price: 699,
    mrp: 1799,
    images: [{ public_id: 'product8', url: "https://images.meesho.com/images/products/8/8_512.jpg" }],
    stock: { quantity: 45, status: 'in_stock' }
  }
];

async function seedProducts() {
  try {
    // Check if products already exist
    const existingProducts = await Product.countDocuments();
    if (existingProducts > 0) {
      logger.info(`Database already has ${existingProducts} products. Skipping seed.`);
      return;
    }

    // Get first category and seller
    const category = await Category.findOne();
    const seller = await Seller.findOne();

    if (!category) {
      logger.error('No category found. Please create a category first.');
      return;
    }

    if (!seller) {
      logger.error('No seller found. Please create a seller first.');
      return;
    }

    // Add category and seller to all products
    const productsToInsert = sampleProducts.map(product => ({
      ...product,
      category: category._id,
      seller: seller._id,
      discount: Math.round(((product.mrp - product.price) / product.mrp) * 100)
    }));

    // Insert products
    const result = await Product.insertMany(productsToInsert);
    logger.info(`Successfully seeded ${result.length} products`);
    
    return result;
  } catch (error) {
    logger.error('Error seeding products:', error);
    throw error;
  }
}

module.exports = seedProducts;
