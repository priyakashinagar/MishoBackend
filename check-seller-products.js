require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./src/models/Product');
const Seller = require('./src/models/Seller');
const User = require('./src/models/User');

async function checkSellerProducts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find user with phone 9777666888
    const user = await User.findOne({ phone: '9777666888' });
    console.log('User:', user ? { _id: user._id, name: user.name, phone: user.phone } : 'Not found');

    if (user) {
      // Find seller profile
      const seller = await Seller.findOne({ user: user._id });
      console.log('\nSeller:', seller ? { _id: seller._id, shopName: seller.shopName, user: seller.user } : 'Not found');

      if (seller) {
        // Find products by this seller
        const products = await Product.find({ seller: seller._id })
          .select('name seller sellerModel')
          .populate('seller', 'shopName')
          .limit(5);
        
        console.log(`\nProducts by ${seller.shopName}:`);
        products.forEach(p => {
          console.log(`- ${p.name}: seller=${p.seller?._id}, shopName=${p.seller?.shopName}, sellerModel=${p.sellerModel}`);
        });

        // Test a single product fetch with full populate
        if (products.length > 0) {
          const testProduct = await Product.findById(products[0]._id)
            .populate({
              path: 'seller',
              select: 'shopName shopLogo description ratings isVerified name phone email'
            })
            .lean();
          
          console.log('\nTest Product Full Populate:');
          console.log(JSON.stringify(testProduct.seller, null, 2));
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSellerProducts();
