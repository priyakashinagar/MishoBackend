/**
 * API Testing Script
 * Tests all seller panel APIs with dummy data
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Import models
const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Inventory = require('./src/models/Inventory');
const Payment = require('./src/models/Payment');
const Warehouse = require('./src/models/Warehouse');
const Claim = require('./src/models/Claim');
const Support = require('./src/models/Support');
const Quality = require('./src/models/Quality');
const Pricing = require('./src/models/Pricing');
const KYC = require('./src/models/KYC');

let testSellerId;
let testProductId;
let testOrderId;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createTestSeller() {
  try {
    console.log('\n📝 Creating test seller...');
    
    // Check if test seller already exists
    let seller = await Seller.findOne({ email: 'testseller@meesho.com' });
    
    if (!seller) {
      seller = await Seller.create({
        businessName: 'Test Seller Store',
        email: 'testseller@meesho.com',
        phone: '9876543210',
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'TEST0001234',
          accountHolderName: 'Test Seller',
          bankName: 'Test Bank'
        }
      });
      console.log('✅ Test seller created:', seller._id);
    } else {
      console.log('✅ Using existing test seller:', seller._id);
    }
    
    testSellerId = seller._id;
    return seller;
  } catch (error) {
    console.error('❌ Error creating seller:', error.message);
    throw error;
  }
}

async function createTestProduct() {
  try {
    console.log('\n📝 Creating test product...');
    
    const product = await Product.create({
      name: 'Test Product - Wireless Earbuds',
      description: 'High quality wireless earbuds for testing',
      price: 1299,
      category: 'Electronics',
      subcategory: 'Audio',
      images: [
        'https://via.placeholder.com/400/6366f1/ffffff?text=Product+1',
        'https://via.placeholder.com/400/8b5cf6/ffffff?text=Product+2'
      ],
      seller: testSellerId,
      stock: {
        quantity: 100,
        status: 'in_stock',
        lowStockThreshold: 10
      },
      specifications: {
        brand: 'TestBrand',
        color: 'Black',
        warranty: '1 Year'
      }
    });
    
    testProductId = product._id;
    console.log('✅ Test product created:', product._id);
    return product;
  } catch (error) {
    console.error('❌ Error creating product:', error.message);
    throw error;
  }
}

async function createTestOrder() {
  try {
    console.log('\n📝 Creating test order...');
    
    const order = await Order.create({
      orderNumber: 'ORD' + Date.now(),
      user: testSellerId, // Using seller as user for testing
      seller: testSellerId,
      items: [{
        product: testProductId,
        quantity: 2,
        price: 1299,
        subtotal: 2598
      }],
      totalAmount: 2598,
      status: 'delivered',
      shippingAddress: {
        name: 'Test Customer',
        phone: '9876543210',
        address: '456 Customer Street',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        country: 'India'
      },
      paymentMethod: 'online',
      paymentStatus: 'paid'
    });
    
    testOrderId = order._id;
    console.log('✅ Test order created:', order._id);
    return order;
  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    throw error;
  }
}

async function testInventoryAPI() {
  try {
    console.log('\n🧪 Testing Inventory API...');
    
    const inventory = await Inventory.create({
      productId: testProductId,
      sellerId: testSellerId,
      sku: 'SKU-TEST-' + Date.now(),
      variants: {
        color: 'Black',
        size: 'Standard'
      },
      stock: {
        total: 100,
        reserved: 10,
        available: 90
      },
      lowStockThreshold: 15,
      stockHistory: [{
        type: 'addition',
        quantity: 100,
        reason: 'Initial stock',
        date: new Date()
      }],
      status: 'in-stock'
    });
    
    console.log('✅ Inventory created:', inventory._id);
    
    // Test update stock
    inventory.stock.total = 120;
    inventory.stock.available = 110;
    inventory.stockHistory.push({
      type: 'addition',
      quantity: 20,
      reason: 'Restocked',
      date: new Date()
    });
    await inventory.save();
    
    console.log('✅ Inventory stock updated');
    
    // Test get all
    const allInventory = await Inventory.find({ sellerId: testSellerId });
    console.log(`✅ Found ${allInventory.length} inventory items`);
    
    return inventory;
  } catch (error) {
    console.error('❌ Inventory API test failed:', error.message);
  }
}

async function testPaymentAPI() {
  try {
    console.log('\n🧪 Testing Payment API...');
    
    const payment = await Payment.create({
      orderId: testOrderId,
      sellerId: testSellerId,
      amount: 2598,
      fees: {
        commission: 259.8,
        shipping: 50,
        tax: 46.76,
        other: 0
      },
      netAmount: 2241.44,
      paymentMethod: 'upi',
      transactionId: 'TXN' + Date.now(),
      status: 'completed',
      settlementDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days later
    });
    
    console.log('✅ Payment created:', payment._id);
    
    // Create pending payment
    const pendingPayment = await Payment.create({
      orderId: testOrderId,
      sellerId: testSellerId,
      amount: 1500,
      fees: {
        commission: 150,
        shipping: 40,
        tax: 27,
        other: 0
      },
      netAmount: 1283,
      paymentMethod: 'cod',
      transactionId: 'TXN' + (Date.now() + 1),
      status: 'pending'
    });
    
    console.log('✅ Pending payment created:', pendingPayment._id);
    
    // Test stats calculation
    const payments = await Payment.find({ sellerId: testSellerId });
    const stats = {
      totalEarnings: payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.netAmount, 0),
      pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.netAmount, 0),
      completedTransactions: payments.filter(p => p.status === 'completed').length
    };
    
    console.log('✅ Payment stats calculated:', stats);
    
    return payment;
  } catch (error) {
    console.error('❌ Payment API test failed:', error.message);
  }
}

async function testWarehouseAPI() {
  try {
    console.log('\n🧪 Testing Warehouse API...');
    
    const warehouse = await Warehouse.create({
      sellerId: testSellerId,
      name: 'Main Warehouse Mumbai',
      location: {
        address: '789 Warehouse Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        country: 'India',
        coordinates: {
          lat: 19.0760,
          lng: 72.8777
        }
      },
      capacity: {
        total: 5000,
        occupied: 1200,
        available: 3800
      },
      contactPerson: {
        name: 'Warehouse Manager',
        phone: '9988776655',
        email: 'warehouse@test.com'
      },
      operatingHours: 'Mon-Sat: 9 AM - 6 PM',
      facilities: ['Temperature Control', 'Security', 'Loading Dock'],
      isActive: true
    });
    
    console.log('✅ Warehouse created:', warehouse._id);
    
    // Test update
    warehouse.capacity.occupied = 1500;
    warehouse.capacity.available = 3500;
    await warehouse.save();
    
    console.log('✅ Warehouse capacity updated');
    
    return warehouse;
  } catch (error) {
    console.error('❌ Warehouse API test failed:', error.message);
  }
}

async function testClaimAPI() {
  try {
    console.log('\n🧪 Testing Claim API...');
    
    const claim = await Claim.create({
      orderId: testOrderId,
      sellerId: testSellerId,
      claimNumber: 'CLM' + Date.now(),
      claimType: 'damaged',
      description: 'Product received in damaged condition',
      claimAmount: 1299,
      status: 'open',
      attachments: ['https://via.placeholder.com/400/ef4444/ffffff?text=Damage+Photo'],
      timeline: [{
        action: 'Claim created',
        date: new Date(),
        by: 'seller'
      }]
    });
    
    console.log('✅ Claim created:', claim._id);
    
    // Test status update
    claim.status = 'in-review';
    claim.timeline.push({
      action: 'Claim under review',
      date: new Date(),
      by: 'admin'
    });
    await claim.save();
    
    console.log('✅ Claim status updated to in-review');
    
    return claim;
  } catch (error) {
    console.error('❌ Claim API test failed:', error.message);
  }
}

async function testSupportAPI() {
  try {
    console.log('\n🧪 Testing Support API...');
    
    const ticket = await Support.create({
      sellerId: testSellerId,
      ticketNumber: 'TKT' + Date.now(),
      subject: 'Payment settlement issue',
      category: 'payments',
      priority: 'high',
      status: 'open',
      messages: [{
        sender: 'seller',
        message: 'My payment has not been settled for last week orders',
        timestamp: new Date()
      }],
      tags: ['payment', 'urgent']
    });
    
    console.log('✅ Support ticket created:', ticket._id);
    
    // Add response
    ticket.messages.push({
      sender: 'support',
      message: 'We are looking into this. Will update you shortly.',
      timestamp: new Date()
    });
    ticket.status = 'in-progress';
    await ticket.save();
    
    console.log('✅ Support ticket updated with response');
    
    return ticket;
  } catch (error) {
    console.error('❌ Support API test failed:', error.message);
  }
}

async function testQualityAPI() {
  try {
    console.log('\n🧪 Testing Quality API...');
    
    const quality = await Quality.create({
      sellerId: testSellerId,
      productId: testProductId,
      metrics: {
        averageRating: 4.5,
        totalReviews: 120,
        returnRate: 2.5,
        defectRate: 1.2,
        customerSatisfaction: 92
      },
      qualityScore: 87.5,
      status: 'excellent',
      lastUpdated: new Date()
    });
    
    console.log('✅ Quality metrics created:', quality._id);
    
    // Test update
    quality.metrics.averageRating = 4.7;
    quality.metrics.totalReviews = 150;
    quality.qualityScore = 90;
    await quality.save();
    
    console.log('✅ Quality metrics updated');
    
    return quality;
  } catch (error) {
    console.error('❌ Quality API test failed:', error.message);
  }
}

async function testPricingAPI() {
  try {
    console.log('\n🧪 Testing Pricing API...');
    
    const pricing = await Pricing.create({
      sellerId: testSellerId,
      productId: testProductId,
      basePrice: 1000,
      sellingPrice: 1299,
      mrp: 1999,
      discount: 35,
      margin: 29.9,
      autoPrice: {
        enabled: false,
        rules: {
          minPrice: 1100,
          maxPrice: 1500,
          competitorBased: false,
          demandBased: false
        }
      },
      priceHistory: [{
        price: 1299,
        changedBy: 'seller',
        reason: 'Initial price',
        date: new Date()
      }]
    });
    
    console.log('✅ Pricing created:', pricing._id);
    
    // Test price update
    pricing.sellingPrice = 1399;
    pricing.margin = 39.9;
    pricing.priceHistory.push({
      price: 1399,
      changedBy: 'seller',
      reason: 'Price increase',
      date: new Date()
    });
    await pricing.save();
    
    console.log('✅ Pricing updated');
    
    return pricing;
  } catch (error) {
    console.error('❌ Pricing API test failed:', error.message);
  }
}

async function testKYCAPI() {
  try {
    console.log('\n🧪 Testing KYC API...');
    
    const kyc = await KYC.create({
      sellerId: testSellerId,
      personalInfo: {
        fullName: 'Test Seller',
        dob: new Date('1990-01-01'),
        gender: 'male',
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        }
      },
      businessInfo: {
        businessName: 'Test Seller Store',
        businessType: 'proprietorship',
        gst: 'TEST123456789',
        pan: 'TESTPAN123'
      },
      documents: [
        {
          type: 'pan',
          documentNumber: 'TESTPAN123',
          fileUrl: 'https://via.placeholder.com/400/3b82f6/ffffff?text=PAN+Card',
          uploadedAt: new Date(),
          verificationStatus: 'pending'
        },
        {
          type: 'aadhar',
          documentNumber: '123456789012',
          fileUrl: 'https://via.placeholder.com/400/3b82f6/ffffff?text=Aadhar+Card',
          uploadedAt: new Date(),
          verificationStatus: 'pending'
        }
      ],
      bankDetails: {
        accountNumber: '1234567890',
        ifsc: 'TEST0001234',
        accountHolder: 'Test Seller',
        bankName: 'Test Bank'
      },
      verificationStatus: 'submitted'
    });
    
    console.log('✅ KYC created:', kyc._id);
    
    // Test verification
    kyc.verificationStatus = 'verified';
    kyc.verifiedAt = new Date();
    kyc.documents.forEach(doc => {
      doc.verificationStatus = 'verified';
    });
    await kyc.save();
    
    console.log('✅ KYC verified');
    
    return kyc;
  } catch (error) {
    console.error('❌ KYC API test failed:', error.message);
  }
}

async function runAllTests() {
  try {
    console.log('🚀 Starting API tests...\n');
    
    await connectDB();
    await createTestSeller();
    await createTestProduct();
    await createTestOrder();
    
    console.log('\n' + '='.repeat(50));
    console.log('Testing all 8 API modules');
    console.log('='.repeat(50));
    
    await testInventoryAPI();
    await testPaymentAPI();
    await testWarehouseAPI();
    await testClaimAPI();
    await testSupportAPI();
    await testQualityAPI();
    await testPricingAPI();
    await testKYCAPI();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log('Seller ID:', testSellerId);
    console.log('Product ID:', testProductId);
    console.log('Order ID:', testOrderId);
    console.log('\n💡 You can now test the frontend with this data!');
    console.log('Login email: testseller@meesho.com');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
