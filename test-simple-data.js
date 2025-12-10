/**
 * Simple Database Population Script
 * Adds test data directly without validation issues
 */

const mongoose = require('mongoose');
require('dotenv').config();

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
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kashinagarpriya:2w8BJ6YhB1C5YStb@cluster0.y3ohb.mongodb.net/meesho?retryWrites=true&w=majority');
    log('green', '✓ Connected to MongoDB');

    // Get existing seller from database
    const Seller = require('./src/models/Seller');
    const sellers = await Seller.find().limit(1);
    
    if (sellers.length === 0) {
      log('red', '✗ No seller found in database. Please create a seller first through the app.');
      process.exit(1);
    }

    const sellerId = sellers[0]._id;
    log('cyan', `\n=== Using Seller: ${sellers[0].shopName} (${sellerId}) ===\n`);

    // Get existing products
    const Product = require('./src/models/Product');
    const products = await Product.find({ seller: sellerId }).limit(5);
    log('green', `✓ Found ${products.length} existing products`);

    if (products.length === 0) {
      log('yellow', '⚠ No products found. Creating sample products...');
      
      const Category = require('./src/models/Category');
      let category = await Category.findOne();
      
      if (!category) {
        category = await Category.create({
          name: 'Fashion',
          slug: 'fashion',
          description: 'Fashion products',
          isActive: true
        });
        log('green', '✓ Category created');
      }

      const product = await Product.create({
        name: 'Test Product',
        description: 'This is a test product for API testing',
        seller: sellerId,
        sellerModel: 'Seller',
        category: category._id,
        price: 499,
        mrp: 999,
        discount: 50,
        images: [{ url: 'https://example.com/product.jpg', public_id: 'test' }],
        stock: { quantity: 100, status: 'in_stock' },
        isActive: true,
        isApproved: true
      });
      products.push(product);
      log('green', `✓ Product created: ${product._id}`);
    }

    const productId = products[0]._id;

    // 1. Create Inventory Data
    log('cyan', '\n1. Creating Inventory Data...');
    const Inventory = require('./src/models/Inventory');
    
    await Inventory.deleteMany({ sellerId });
    
    const inventory = await Inventory.create({
      productId: productId,
      sellerId: sellerId,
      sku: 'SKU-TEST-' + Date.now(),
      variant: { size: 'M', color: 'Blue' },
      stock: {
        available: 85,
        reserved: 10,
        damaged: 5,
        total: 100
      },
      reorderLevel: 20,
      reorderQuantity: 50,
      status: 'in-stock',
      stockHistory: [
        { type: 'addition', quantity: 100, reason: 'Initial stock' }
      ]
    });
    log('green', `✓ Inventory created: ${inventory._id}`);

    // Low stock item
    const lowStockInv = await Inventory.create({
      productId: productId,
      sellerId: sellerId,
      sku: 'SKU-LOW-' + Date.now(),
      stock: {
        available: 8,
        reserved: 2,
        damaged: 0,
        total: 10
      },
      reorderLevel: 20,
      status: 'low-stock'
    });
    log('green', `✓ Low stock inventory created: ${lowStockInv._id}`);

    // 2. Create Payment Data
    log('cyan', '\n2. Creating Payment Data...');
    const Payment = require('./src/models/Payment');
    
    await Payment.deleteMany({ sellerId });
    
    const payment1 = await Payment.create({
      sellerId: sellerId,
      transactionId: 'TXN-' + Date.now() + '-1',
      amount: 2500,
      type: 'sale',
      fees: {
        commission: 250,
        shipping: 50,
        tax: 125,
        other: 25
      },
      netAmount: 2050,
      method: 'bank-transfer',
      status: 'completed',
      settlementDate: new Date()
    });
    log('green', `✓ Payment created: ${payment1._id}`);

    const payment2 = await Payment.create({
      sellerId: sellerId,
      transactionId: 'TXN-' + Date.now() + '-2',
      amount: 1500,
      type: 'settlement',
      fees: { commission: 150, shipping: 0, tax: 75, other: 0 },
      netAmount: 1275,
      method: 'bank-transfer',
      status: 'pending'
    });
    log('green', `✓ Pending payment created: ${payment2._id}`);

    // 3. Create Warehouse Data
    log('cyan', '\n3. Creating Warehouse Data...');
    const Warehouse = require('./src/models/Warehouse');
    
    await Warehouse.deleteMany({ sellerId });
    
    const warehouse = await Warehouse.create({
      sellerId: sellerId,
      name: 'Main Warehouse',
      code: 'WH-' + Date.now(),
      type: 'main',
      location: {
        address: '123 Warehouse Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        coordinates: { lat: 19.0760, lng: 72.8777 }
      },
      capacity: {
        total: 10000,
        occupied: 4500
      },
      contactPerson: {
        name: 'Manager',
        phone: '9876543210',
        email: 'warehouse@test.com'
      },
      operatingHours: {
        start: '09:00',
        end: '18:00'
      },
      facilities: ['cold-storage', 'loading-dock'],
      isActive: true
    });
    log('green', `✓ Warehouse created: ${warehouse._id}`);

    // 4. Create Claims Data
    log('cyan', '\n4. Creating Claims Data...');
    const Claim = require('./src/models/Claim');
    
    await Claim.deleteMany({ sellerId });
    
    const claim = await Claim.create({
      sellerId: sellerId,
      claimNumber: 'CLM-' + Date.now(),
      type: 'return-dispute',
      subject: 'Customer return dispute',
      description: 'Customer wants to return product without valid reason',
      amount: 999,
      status: 'under-review',
      priority: 'high'
    });
    log('green', `✓ Claim created: ${claim._id}`);

    // 5. Create Support Tickets
    log('cyan', '\n5. Creating Support Tickets...');
    const Support = require('./src/models/Support');
    
    await Support.deleteMany({ sellerId });
    
    const support = await Support.create({
      sellerId: sellerId,
      ticketNumber: 'TKT-' + Date.now(),
      category: 'technical',
      subject: 'Product upload issue',
      description: 'Unable to upload product images',
      status: 'open',
      priority: 'medium',
      messages: [{
        sender: sellerId,
        message: 'I cannot upload images. Please help.',
        timestamp: new Date()
      }],
      tags: ['image-upload', 'technical']
    });
    log('green', `✓ Support ticket created: ${support._id}`);

    // 6. Create Quality Metrics
    log('cyan', '\n6. Creating Quality Metrics...');
    const Quality = require('./src/models/Quality');
    
    await Quality.deleteMany({ sellerId });
    
    const quality = await Quality.create({
      sellerId: sellerId,
      productId: productId,
      metrics: {
        averageRating: 4.5,
        totalReviews: 150,
        returnRate: 2.8,
        defectRate: 1.2,
        customerSatisfaction: 94
      },
      issues: [
        { type: 'quality-issue', count: 2, severity: 'low' }
      ],
      lastAudit: new Date()
    });
    log('green', `✓ Quality metrics created: ${quality._id} (Score: ${quality.score})`);

    // 7. Create Pricing Data
    log('cyan', '\n7. Creating Pricing Data...');
    const Pricing = require('./src/models/Pricing');
    
    await Pricing.deleteMany({ sellerId });
    
    const pricing = await Pricing.create({
      sellerId: sellerId,
      productId: productId,
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
    log('green', `✓ Pricing created: ${pricing._id} (Margin: ${pricing.margin.toFixed(1)}%)`);

    // 8. Create KYC Data
    log('cyan', '\n8. Creating KYC Data...');
    const KYC = require('./src/models/KYC');
    
    await KYC.deleteMany({ sellerId });
    
    const kyc = await KYC.create({
      sellerId: sellerId,
      personalInfo: {
        fullName: sellers[0].shopName || 'Test Seller',
        dob: new Date('1990-01-01'),
        pan: 'ABCDE1234F',
        aadhaar: '123456789012',
        email: 'seller@test.com',
        phone: '9876543210'
      },
      businessInfo: {
        businessName: sellers[0].shopName,
        businessType: 'individual',
        gstin: 'TEST1234567890',
        businessAddress: '123 Business Street'
      },
      documents: [
        { type: 'pan', url: 'https://example.com/pan.jpg', status: 'verified', verifiedAt: new Date() },
        { type: 'aadhaar', url: 'https://example.com/aadhaar.jpg', status: 'verified', verifiedAt: new Date() }
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

    // Summary
    log('cyan', '\n=== ✓ All Test Data Created Successfully ===\n');
    log('yellow', '📊 Summary:');
    log('green', `   • Seller: ${sellers[0].shopName} (${sellerId})`);
    log('green', `   • Products: ${products.length}`);
    log('green', `   • Inventory Items: 2 (1 in-stock, 1 low-stock)`);
    log('green', `   • Payments: 2 (1 completed, 1 pending)`);
    log('green', `   • Warehouses: 1`);
    log('green', `   • Claims: 1 (under-review)`);
    log('green', `   • Support Tickets: 1 (open)`);
    log('green', `   • Quality Metrics: 1 (Score: ${quality.score})`);
    log('green', `   • Pricing Records: 1 (Margin: ${pricing.margin.toFixed(1)}%)`);
    log('green', `   • KYC: Verified\n`);

    log('green', '✓ You can now test all APIs with this data!\n');

  } catch (error) {
    log('red', '✗ Error: ' + error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    log('yellow', 'Disconnected from MongoDB');
  }
}

main();
