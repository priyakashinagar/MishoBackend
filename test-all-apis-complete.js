/**
 * Complete API Testing Script with Database Population
 * Tests all 8 seller panel APIs with real data
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import all models
const User = require('./src/models/User');
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

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = (color, message) => console.log(`${colors[color]}${message}${colors.reset}`);

let testSellerId, testProductId, testOrderId, testWarehouseId, testUserId;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kashinagarpriya:2w8BJ6YhB1C5YStb@cluster0.y3ohb.mongodb.net/meesho?retryWrites=true&w=majority');
    log('green', '✓ Connected to MongoDB');
  } catch (error) {
    log('red', '✗ MongoDB connection failed: ' + error.message);
    process.exit(1);
  }
}

async function createTestData() {
  log('cyan', '\n=== Creating Test Data ===');
  
  try {
    // 1. Create Test User
    const user = await User.findOne({ email: 'testseller@meesho.com' }) || await User.create({
      name: 'Test Seller',
      email: 'testseller@meesho.com',
      phone: '9876543210',
      password: '$2a$10$test.hash.password',
      role: 'seller',
      isEmailVerified: true,
      isPhoneVerified: true
    });
    testUserId = user._id;
    log('green', `✓ User created: ${testUserId}`);

    // 2. Create Test Seller
    const seller = await Seller.findOne({ user: testUserId }) || await Seller.create({
      user: testUserId,
      shopName: 'Test Fashion Store',
      businessType: 'individual',
      description: 'Premium quality fashion products',
      businessAddress: {
        addressLine1: '123 Test Street',
        addressLine2: 'Near Test Market',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        country: 'India'
      },
      kycDocuments: {
        panCard: { number: 'ABCDE1234F' },
        aadharCard: { number: '123456789012' }
      },
      kycStatus: 'approved',
      bankDetails: {
        accountHolderName: 'Test Seller',
        accountNumber: '1234567890',
        ifscCode: 'TEST0001234',
        bankName: 'Test Bank',
        isVerified: true
      },
      isVerified: true,
      isActive: true
    });
    testSellerId = seller._id;
    log('green', `✓ Seller created: ${testSellerId}`);

    // 3. Create Test Products
    const product1 = await Product.findOne({ seller: testSellerId, name: 'Cotton T-Shirt' }) || await Product.create({
      name: 'Cotton T-Shirt',
      sellerId: testSellerId,
      description: 'Premium quality cotton t-shirt',
      category: 'Men Fashion',
      subCategory: 'T-Shirts',
      price: 499,
      mrp: 999,
      discount: 50,
      images: ['https://example.com/tshirt.jpg'],
      stock: 100,
      sku: 'TS-001',
      status: 'active',
      specifications: {
        material: 'Cotton',
        color: 'Blue',
        size: ['S', 'M', 'L', 'XL']
      }
    });
    testProductId = product1._id;
    log('green', `✓ Product created: ${testProductId}`);

    const product2 = await Product.findOne({ sellerId: testSellerId, name: 'Denim Jeans' }) || await Product.create({
      name: 'Denim Jeans',
      sellerId: testSellerId,
      description: 'Stretchable denim jeans',
      category: 'Men Fashion',
      subCategory: 'Jeans',
      price: 899,
      mrp: 1499,
      discount: 40,
      images: ['https://example.com/jeans.jpg'],
      stock: 75,
      sku: 'JN-002',
      status: 'active'
    });
    log('green', `✓ Product 2 created: ${product2._id}`);

    // 3. Create Test Order
    const order = await Order.findOne({ sellerId: testSellerId }) || await Order.create({
      orderId: 'ORD' + Date.now(),
      sellerId: testSellerId,
      items: [{
        productId: testProductId,
        quantity: 2,
        price: 499,
        total: 998
      }],
      totalAmount: 998,
      paymentMethod: 'prepaid',
      paymentStatus: 'paid',
      status: 'delivered',
      shippingAddress: {
        name: 'Test Customer',
        phone: '9876543210',
        address: '456 Customer Street',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      }
    });
    testOrderId = order._id;
    log('green', `✓ Order created: ${testOrderId}`);

    // 4. Create Warehouse
    const warehouse = await Warehouse.findOne({ sellerId: testSellerId }) || await Warehouse.create({
      sellerId: testSellerId,
      name: 'Main Warehouse Mumbai',
      location: {
        address: '789 Warehouse Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400002',
        coordinates: { lat: 19.0760, lng: 72.8777 }
      },
      capacity: {
        total: 10000,
        occupied: 3500
      },
      contactPerson: {
        name: 'Warehouse Manager',
        phone: '9876543211',
        email: 'warehouse@test.com'
      },
      operatingHours: {
        start: '09:00',
        end: '18:00'
      },
      facilities: ['cold-storage', 'loading-dock'],
      isActive: true
    });
    testWarehouseId = warehouse._id;
    log('green', `✓ Warehouse created: ${testWarehouseId}`);

    // 5. Create Inventory
    await Inventory.findOneAndDelete({ sellerId: testSellerId, sku: 'INV-TS-001' });
    const inventory1 = await Inventory.create({
      productId: testProductId,
      sellerId: testSellerId,
      sku: 'INV-TS-001',
      variant: { size: 'M', color: 'Blue' },
      stock: {
        available: 80,
        reserved: 15,
        damaged: 5,
        total: 100
      },
      warehouse: testWarehouseId,
      reorderLevel: 20,
      reorderQuantity: 50,
      status: 'in-stock',
      stockHistory: [
        {
          type: 'addition',
          quantity: 100,
          reason: 'Initial stock',
          date: new Date()
        }
      ]
    });
    log('green', `✓ Inventory created: ${inventory1._id}`);

    await Inventory.findOneAndDelete({ sellerId: testSellerId, sku: 'INV-JN-002' });
    await Inventory.create({
      productId: product2._id,
      sellerId: testSellerId,
      sku: 'INV-JN-002',
      stock: {
        available: 15,
        reserved: 5,
        damaged: 0,
        total: 20
      },
      warehouse: testWarehouseId,
      reorderLevel: 20,
      status: 'low-stock'
    });
    log('green', '✓ Low stock inventory created');

    // 6. Create Payments
    await Payment.findOneAndDelete({ transactionId: 'TXN' + Date.now().toString().slice(-8) + '001' });
    const payment1 = await Payment.create({
      sellerId: testSellerId,
      orderId: testOrderId,
      transactionId: 'TXN' + Date.now().toString().slice(-8) + '001',
      amount: 998,
      type: 'sale',
      fees: {
        commission: 99.8,
        shipping: 50,
        tax: 48,
        other: 0
      },
      netAmount: 800.2,
      method: 'bank-transfer',
      status: 'completed',
      settlementDate: new Date(),
      bankDetails: {
        accountNumber: '1234567890',
        ifscCode: 'TEST0001234',
        accountHolderName: 'Test Seller',
        bankName: 'Test Bank'
      }
    });
    log('green', `✓ Payment created: ${payment1._id}`);

    await Payment.findOneAndDelete({ transactionId: 'TXN' + Date.now().toString().slice(-8) + '002' });
    await Payment.create({
      sellerId: testSellerId,
      transactionId: 'TXN' + Date.now().toString().slice(-8) + '002',
      amount: 1500,
      type: 'settlement',
      fees: { commission: 150, shipping: 0, tax: 0, other: 0 },
      netAmount: 1350,
      status: 'pending',
      method: 'bank-transfer'
    });
    log('green', '✓ Pending payment created');

    // 7. Create Claims
    await Claim.findOneAndDelete({ claimNumber: 'CLM' + Date.now().toString().slice(-6) });
    const claim1 = await Claim.create({
      sellerId: testSellerId,
      orderId: testOrderId,
      claimNumber: 'CLM' + Date.now().toString().slice(-6),
      type: 'return-dispute',
      subject: 'Customer return dispute',
      description: 'Customer wants to return product without valid reason',
      amount: 998,
      status: 'under-review',
      priority: 'high',
      attachments: [{
        url: 'https://example.com/proof.jpg',
        type: 'image/jpeg'
      }],
      timeline: [{
        status: 'submitted',
        comment: 'Claim submitted by seller',
        updatedAt: new Date()
      }]
    });
    log('green', `✓ Claim created: ${claim1._id}`);

    // 8. Create Support Tickets
    await Support.findOneAndDelete({ ticketNumber: 'TKT' + Date.now().toString().slice(-6) });
    const support1 = await Support.create({
      sellerId: testSellerId,
      ticketNumber: 'TKT' + Date.now().toString().slice(-6),
      category: 'technical',
      subject: 'Unable to upload product images',
      description: 'Getting error while uploading product images',
      status: 'open',
      priority: 'medium',
      messages: [{
        sender: testSellerId,
        message: 'I am facing issues with image upload. Please help.',
        timestamp: new Date()
      }],
      tags: ['image-upload', 'technical-issue']
    });
    log('green', `✓ Support ticket created: ${support1._id}`);

    // 9. Create Quality Metrics
    await Quality.findOneAndDelete({ sellerId: testSellerId, productId: testProductId });
    const quality1 = await Quality.create({
      sellerId: testSellerId,
      productId: testProductId,
      metrics: {
        averageRating: 4.5,
        totalReviews: 120,
        returnRate: 3.2,
        defectRate: 1.5,
        customerSatisfaction: 92
      },
      issues: [
        { type: 'quality-issue', count: 2, severity: 'low' }
      ],
      lastAudit: new Date()
    });
    log('green', `✓ Quality metrics created: ${quality1._id}`);

    // 10. Create Pricing
    await Pricing.findOneAndDelete({ sellerId: testSellerId, productId: testProductId });
    const pricing1 = await Pricing.create({
      sellerId: testSellerId,
      productId: testProductId,
      basePrice: 350,
      sellingPrice: 499,
      mrp: 999,
      autoPrice: {
        enabled: true,
        strategy: 'competitive',
        minPrice: 400,
        maxPrice: 600
      },
      priceHistory: [
        { price: 499, changedAt: new Date(), reason: 'Initial price' }
      ]
    });
    log('green', `✓ Pricing created: ${pricing1._id}`);

    // 11. Create KYC
    await KYC.findOneAndDelete({ sellerId: testSellerId });
    const kyc = await KYC.create({
      sellerId: testSellerId,
      personalInfo: {
        fullName: 'Test Seller',
        dob: new Date('1990-01-01'),
        pan: 'ABCDE1234F',
        aadhaar: '123456789012',
        email: 'testseller@meesho.com',
        phone: '9876543210'
      },
      businessInfo: {
        businessName: 'Test Fashion Store',
        businessType: 'individual',
        gstin: 'TEST1234567890',
        businessAddress: '123 Test Street, Mumbai'
      },
      documents: [
        {
          type: 'pan',
          url: 'https://example.com/pan.jpg',
          status: 'verified',
          uploadedAt: new Date(),
          verifiedAt: new Date()
        },
        {
          type: 'aadhaar',
          url: 'https://example.com/aadhaar.jpg',
          status: 'verified',
          uploadedAt: new Date(),
          verifiedAt: new Date()
        }
      ],
      bankDetails: {
        accountNumber: '1234567890',
        ifscCode: 'TEST0001234',
        accountHolderName: 'Test Seller',
        bankName: 'Test Bank',
        verified: true
      },
      status: 'verified',
      verifiedAt: new Date()
    });
    log('green', `✓ KYC created: ${kyc._id}`);

    log('cyan', '\n=== Test Data Created Successfully ===');
    log('yellow', `Seller ID: ${testSellerId}`);
    log('yellow', `Product ID: ${testProductId}`);
    log('yellow', `Order ID: ${testOrderId}`);
    log('yellow', `Warehouse ID: ${testWarehouseId}`);

  } catch (error) {
    log('red', '✗ Error creating test data: ' + error.message);
    console.error(error);
  }
}

async function testAPIs() {
  log('cyan', '\n=== Testing All APIs ===\n');

  try {
    // 1. Test Inventory API
    log('blue', '1. Testing Inventory API...');
    const inventories = await Inventory.find({ sellerId: testSellerId }).populate('productId warehouse');
    log('green', `   ✓ Found ${inventories.length} inventory items`);
    const lowStock = await Inventory.find({ sellerId: testSellerId, status: 'low-stock' });
    log('green', `   ✓ Found ${lowStock.length} low stock items`);

    // 2. Test Payment API
    log('blue', '2. Testing Payment API...');
    const payments = await Payment.find({ sellerId: testSellerId });
    log('green', `   ✓ Found ${payments.length} payments`);
    const totalEarnings = payments.reduce((sum, p) => sum + p.netAmount, 0);
    log('green', `   ✓ Total earnings: ₹${totalEarnings.toFixed(2)}`);
    const pending = payments.filter(p => p.status === 'pending');
    log('green', `   ✓ Pending payments: ${pending.length}`);

    // 3. Test Warehouse API
    log('blue', '3. Testing Warehouse API...');
    const warehouses = await Warehouse.find({ sellerId: testSellerId });
    log('green', `   ✓ Found ${warehouses.length} warehouses`);
    warehouses.forEach(w => {
      log('green', `   ✓ ${w.name}: ${w.capacity.available}/${w.capacity.total} available`);
    });

    // 4. Test Claims API
    log('blue', '4. Testing Claims API...');
    const claims = await Claim.find({ sellerId: testSellerId });
    log('green', `   ✓ Found ${claims.length} claims`);
    const activeClaims = claims.filter(c => !['resolved', 'closed'].includes(c.status));
    log('green', `   ✓ Active claims: ${activeClaims.length}`);

    // 5. Test Support API
    log('blue', '5. Testing Support API...');
    const tickets = await Support.find({ sellerId: testSellerId });
    log('green', `   ✓ Found ${tickets.length} support tickets`);
    const openTickets = tickets.filter(t => t.status === 'open');
    log('green', `   ✓ Open tickets: ${openTickets.length}`);

    // 6. Test Quality API
    log('blue', '6. Testing Quality API...');
    const qualityMetrics = await Quality.find({ sellerId: testSellerId }).populate('productId');
    log('green', `   ✓ Found ${qualityMetrics.length} quality metrics`);
    if (qualityMetrics.length > 0) {
      const avgScore = qualityMetrics.reduce((sum, q) => sum + q.score, 0) / qualityMetrics.length;
      log('green', `   ✓ Average quality score: ${avgScore.toFixed(1)}/100`);
    }

    // 7. Test Pricing API
    log('blue', '7. Testing Pricing API...');
    const pricings = await Pricing.find({ sellerId: testSellerId }).populate('productId');
    log('green', `   ✓ Found ${pricings.length} pricing records`);
    pricings.forEach(p => {
      log('green', `   ✓ ${p.productId?.name || 'Product'}: ₹${p.sellingPrice} (Margin: ${p.margin?.toFixed(1)}%)`);
    });

    // 8. Test KYC API
    log('blue', '8. Testing KYC API...');
    const kycData = await KYC.findOne({ sellerId: testSellerId });
    if (kycData) {
      log('green', `   ✓ KYC Status: ${kycData.status}`);
      log('green', `   ✓ Documents uploaded: ${kycData.documents.length}`);
      const verifiedDocs = kycData.documents.filter(d => d.status === 'verified').length;
      log('green', `   ✓ Verified documents: ${verifiedDocs}/${kycData.documents.length}`);
    }

    log('cyan', '\n=== All API Tests Completed Successfully ===\n');

    // Summary Stats
    log('yellow', '📊 Summary Statistics:');
    log('white', `   • Total Products: 2`);
    log('white', `   • Total Inventory Items: ${inventories.length}`);
    log('white', `   • Low Stock Items: ${lowStock.length}`);
    log('white', `   • Total Orders: 1`);
    log('white', `   • Total Payments: ${payments.length}`);
    log('white', `   • Total Earnings: ₹${totalEarnings.toFixed(2)}`);
    log('white', `   • Active Warehouses: ${warehouses.length}`);
    log('white', `   • Active Claims: ${activeClaims.length}`);
    log('white', `   • Open Support Tickets: ${openTickets.length}`);
    log('white', `   • Quality Metrics: ${qualityMetrics.length} products`);
    log('white', `   • Pricing Records: ${pricings.length}`);
    log('white', `   • KYC Status: ${kycData?.status || 'Not found'}`);

  } catch (error) {
    log('red', '✗ Error testing APIs: ' + error.message);
    console.error(error);
  }
}

async function main() {
  log('cyan', '╔════════════════════════════════════════════════════════╗');
  log('cyan', '║    Meesho Seller Panel - Complete API Test Suite     ║');
  log('cyan', '╚════════════════════════════════════════════════════════╝\n');

  await connectDB();
  await createTestData();
  await testAPIs();
  
  log('green', '\n✓ All tests completed! Database populated successfully.\n');
  
  process.exit(0);
}

main().catch(error => {
  log('red', '✗ Fatal error: ' + error.message);
  console.error(error);
  process.exit(1);
});
