/**
 * Quick script to create a test order
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');

async function createTestOrder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Get a user (customer)
    const user = await User.findOne({ role: 'user' });
    if (!user) {
      console.log('❌ No user found. Create a user first.');
      process.exit(1);
    }

    // Get a seller
    const seller = await Seller.findOne();
    if (!seller) {
      console.log('❌ No seller found. Create a seller first.');
      process.exit(1);
    }

    // Get a product
    const product = await Product.findOne({ seller: seller._id });
    if (!product) {
      console.log('❌ No product found for this seller.');
      process.exit(1);
    }

    console.log(`👤 Customer: ${user.name} (${user.email})`);
    console.log(`🏪 Seller: ${seller.shopName || seller.businessDetails?.businessName}`);
    console.log(`📦 Product: ${product.name} - ₹${product.price}\n`);

    // Create test order
    const orderData = {
      orderId: `ORD${Date.now()}`,
      user: user._id,
      items: [{
        product: product._id,
        seller: seller._id,
        name: product.name,
        price: product.price,
        quantity: 2,
        image: product.images?.[0]?.url || '',
        variant: product.variants?.[0] || {}
      }],
      pricing: {
        itemsTotal: product.price * 2,
        deliveryFee: 50,
        discount: 0,
        total: (product.price * 2) + 50
      },
      payment: {
        method: 'cod',
        status: 'pending'
      },
      shippingAddress: {
        fullName: user.name,
        phone: user.phone || '9876543210',
        addressLine1: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      status: 'delivered',
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      earnings: {
        sellerRevenue: product.price * 2,
        platformCommission: (product.price * 2) * 0.10, // 10% commission
        paymentGatewayFee: 20,
        shippingCost: 30,
        totalTax: ((product.price * 2) * 0.10) * 0.18, // 18% GST on commission
        netSellerEarning: (product.price * 2) - ((product.price * 2) * 0.10) - 20 - 30
      },
      payout: {
        status: 'upcoming',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      }
    };

    const order = await Order.create(orderData);

    console.log('✅ Test order created successfully!');
    console.log(`📋 Order ID: ${order.orderId}`);
    console.log(`💰 Total: ₹${order.pricing.total}`);
    console.log(`📦 Status: ${order.status}`);
    console.log(`💳 Payment: ${order.payment.method}\n`);

    // Create 4 more orders with different statuses
    const statuses = ['pending', 'confirmed', 'processing', 'shipped'];
    
    for (let i = 0; i < 4; i++) {
      const newOrder = {
        ...orderData,
        orderId: `ORD${Date.now() + i}`,
        status: statuses[i],
        deliveredAt: null,
        items: [{
          ...orderData.items[0],
          quantity: Math.floor(Math.random() * 3) + 1
        }]
      };
      
      if (statuses[i] === 'pending' || statuses[i] === 'confirmed') {
        delete newOrder.earnings;
        delete newOrder.payout;
      }
      
      await Order.create(newOrder);
      console.log(`✅ Created ${statuses[i]} order`);
    }

    console.log(`\n🎉 Created 5 test orders total!`);
    console.log('✓ MongoDB connection closed\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createTestOrder();
