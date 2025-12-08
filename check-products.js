require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Seller = require('./src/models/Seller');

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check products without seller
    const productsWithoutSeller = await Product.countDocuments({ seller: null });
    console.log(`\nProducts without seller: ${productsWithoutSeller}`);

    // Check sample products
    const sampleProducts = await Product.find({}).limit(3).select('name seller sellerModel');
    console.log('\nSample products:');
    sampleProducts.forEach(p => {
      console.log(`- ${p.name}: seller=${p.seller}, sellerModel=${p.sellerModel}`);
    });

    // Check sellers
    const sellerCount = await Seller.countDocuments({});
    console.log(`\nTotal sellers: ${sellerCount}`);

    if (sellerCount > 0) {
      const sampleSeller = await Seller.findOne({}).select('_id shopName user');
      console.log('\nSample seller:', sampleSeller);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkProducts();
