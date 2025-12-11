/**
 * Add Inventory Data for lovelyStore Seller
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Inventory = require('./src/models/Inventory');

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Find lovelyStore seller
    const sellerId = '69315198fc205813950427f4';
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      console.log('✗ lovelyStore seller not found!');
      process.exit(1);
    }
    
    console.log(`✓ Found seller: ${seller.shopName} (${seller._id})\n`);

    // Get products for this seller
    const products = await Product.find({ seller: sellerId }).limit(5);
    console.log(`✓ Found ${products.length} products for this seller\n`);

    if (products.length === 0) {
      console.log('✗ No products found for this seller!');
      console.log('Please create some products first.');
      process.exit(1);
    }

    // Clear old inventory for this seller
    await Inventory.deleteMany({ sellerId: sellerId });
    console.log('✓ Cleared old inventory data\n');

    // Create inventory for each product
    const inventoryItems = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const stockLevels = [
        { available: 50, reserved: 5, damaged: 0 },
        { available: 60, reserved: 6, damaged: 1 },
        { available: 70, reserved: 7, damaged: 2 },
        { available: 80, reserved: 8, damaged: 3 },
        { available: 40, reserved: 4, damaged: 1 },
      ];
      
      const stock = stockLevels[i % stockLevels.length];
      const totalStock = stock.available + stock.reserved + stock.damaged;
      
      const inventoryItem = new Inventory({
        sellerId: sellerId,
        productId: product._id,
        sku: `SKU-${Date.now()}-${i}`,
        stock: {
          available: stock.available,
          reserved: stock.reserved,
          damaged: stock.damaged,
          total: totalStock,
        },
        status: stock.available <= 20 ? 'low-stock' : stock.available === 0 ? 'out-of-stock' : 'in-stock',
      });
      
      await inventoryItem.save();
      inventoryItems.push(inventoryItem);
      
      console.log(`✓ Created inventory for: ${product.name}`);
      console.log(`  SKU: ${inventoryItem.sku}`);
      console.log(`  Stock: ${stock.available} available, ${stock.reserved} reserved, ${stock.damaged} damaged, ${totalStock} total`);
      console.log(`  Status: ${inventoryItem.status}\n`);
    }

    console.log(`\n✅ Successfully created ${inventoryItems.length} inventory items!`);
    console.log(`\n📌 Seller ID to use: ${sellerId}`);
    console.log('🔄 Refresh your inventory page now!\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
    process.exit(0);
  }
}

main();
