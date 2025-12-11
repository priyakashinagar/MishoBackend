/**
 * Check Current Seller and Add Inventory Data
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Inventory = require('./src/models/Inventory');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    log('green', '✓ Connected to MongoDB\n');

    // List all sellers
    const sellers = await Seller.find().select('_id shopName user');
    log('cyan', '=== Available Sellers ===');
    sellers.forEach((s, i) => {
      log('yellow', `${i + 1}. Shop: ${s.shopName} | ID: ${s._id} | User: ${s.user}`);
    });

    if (sellers.length === 0) {
      log('red', '\n✗ No sellers found in database!');
      process.exit(1);
    }

    // Use lovelyStore seller (the currently logged-in seller)
    const seller = await Seller.findById('69315198fc205813950427f4');
    if (!seller) {
      log('red', '\n✗ Seller "lovelyStore" not found!');
      process.exit(1);
    }
    log('cyan', `\n=== Using Seller: ${seller.shopName} (${seller._id}) ===\n`);

    // Get products for this seller
    const products = await Product.find({ seller: seller._id }).limit(5);
    log('green', `✓ Found ${products.length} products for this seller`);

    if (products.length === 0) {
      log('red', '✗ No products found for this seller!');
      log('yellow', 'Please add products first before creating inventory.');
      process.exit(1);
    }

    // Clear old inventory for this seller
    await Inventory.deleteMany({ sellerId: seller._id });
    log('yellow', '✓ Cleared old inventory data');

    // Create inventory for each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      const inventory = await Inventory.create({
        productId: product._id,
        sellerId: seller._id,
        sku: `SKU-${Date.now()}-${i}`,
        variant: { size: 'M', color: 'Blue' },
        stock: {
          available: 50 + (i * 10),
          reserved: 5 + i,
          damaged: i,
          total: 55 + (i * 11)
        },
        reorderLevel: 20,
        reorderQuantity: 50,
        status: i === 0 ? 'low-stock' : 'in-stock',
        stockHistory: [
          { type: 'addition', quantity: 55 + (i * 11), reason: 'Initial stock' }
        ]
      });
      
      log('green', `✓ Created inventory for: ${product.name} (SKU: ${inventory.sku})`);
    }

    log('cyan', '\n=== ✓ Inventory Data Created Successfully ===\n');
    log('green', `Seller ID to use in frontend: ${seller._id}`);
    log('yellow', '\nNow refresh your inventory page!');

  } catch (error) {
    log('red', '✗ Error: ' + error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

main();
