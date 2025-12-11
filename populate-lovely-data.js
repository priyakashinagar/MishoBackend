/**
 * Populate All API Data for lovelyStore Seller
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Seller = require('./src/models/Seller');
const Product = require('./src/models/Product');
const Inventory = require('./src/models/Inventory');
const Payment = require('./src/models/Payment');
const Warehouse = require('./src/models/Warehouse');
const Claim = require('./src/models/Claim');
const Support = require('./src/models/Support');
const Quality = require('./src/models/Quality');
const Pricing = require('./src/models/Pricing');
const KYC = require('./src/models/KYC');

const SELLER_ID = '69315198fc205813950427f4';

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    // Verify seller exists
    const seller = await Seller.findById(SELLER_ID);
    if (!seller) {
      console.log('✗ lovelyStore seller not found!');
      process.exit(1);
    }
    console.log(`✓ Found seller: ${seller.shopName} (${seller._id})\n`);

    // Get products
    const products = await Product.find({ seller: SELLER_ID }).limit(5);
    console.log(`✓ Found ${products.length} products\n`);

    // 1. CREATE PAYMENTS
    console.log('📊 Creating Payment records...');
    await Payment.deleteMany({ sellerId: SELLER_ID });
    
    const payments = [
      {
        sellerId: SELLER_ID,
        transactionId: `TXN-${Date.now()}-1`,
        amount: 2500,
        netAmount: 2300,
        type: 'sale',
        status: 'completed',
        method: 'bank-transfer',
        description: 'Order payment for December sales',
        fees: {
          commission: 150,
          shipping: 50,
          tax: 0,
          other: 0
        }
      },
      {
        sellerId: SELLER_ID,
        transactionId: `TXN-${Date.now()}-2`,
        amount: 1800,
        netAmount: 1650,
        type: 'sale',
        status: 'pending',
        method: 'upi',
        description: 'Pending order payment'
      },
      {
        sellerId: SELLER_ID,
        transactionId: `TXN-${Date.now()}-3`,
        amount: 500,
        netAmount: 450,
        type: 'refund',
        status: 'completed',
        method: 'wallet',
        description: 'Customer refund processed',
        fees: {
          commission: 50,
          shipping: 0,
          tax: 0,
          other: 0
        }
      },
      {
        sellerId: SELLER_ID,
        transactionId: `TXN-${Date.now()}-4`,
        amount: 3200,
        netAmount: 2900,
        type: 'settlement',
        status: 'completed',
        method: 'bank-transfer',
        description: 'Weekly settlement',
        settlementDate: new Date()
      }
    ];
    
    for (const paymentData of payments) {
      const payment = new Payment(paymentData);
      await payment.save();
      console.log(`  ✓ Created payment: ${payment.transactionId} - ₹${payment.amount} → ₹${payment.netAmount} (${payment.status})`);
    }

    // 2. CREATE WAREHOUSE
    console.log('\n🏢 Creating Warehouse records...');
    await Warehouse.deleteMany({ sellerId: SELLER_ID });
    
    const warehouses = [
      {
        sellerId: SELLER_ID,
        name: 'Main Warehouse - Delhi',
        code: `WH-LOVELY-${Date.now()}`,
        type: 'main',
        location: {
          address: '123 Industrial Area, Sector 12',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        },
        contact: {
          phone: '9876543210',
          email: 'warehouse@lovelystore.com',
          manager: 'Warehouse Manager'
        },
        capacity: 15000,
        currentStock: 8500,
        isActive: true
      },
      {
        sellerId: SELLER_ID,
        name: 'Secondary Warehouse - Mumbai',
        code: `WH-LOVELY-SEC-${Date.now()}`,
        type: 'regional',
        location: {
          address: '456 Andheri East, Near Metro',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400069',
          country: 'India'
        },
        contact: {
          phone: '9876543211',
          email: 'mumbai@lovelystore.com',
          manager: 'Mumbai Manager'
        },
        capacity: 10000,
        currentStock: 3200,
        isActive: true
      }
    ];
    
    for (const warehouseData of warehouses) {
      const warehouse = new Warehouse(warehouseData);
      await warehouse.save();
      console.log(`  ✓ Created warehouse: ${warehouse.name} (${warehouse.code})`);
      console.log(`    Capacity: ${warehouse.currentStock}/${warehouse.capacity}`);
    }

    // 3. CREATE CLAIMS
    console.log('\n📋 Creating Claim records...');
    await Claim.deleteMany({ sellerId: SELLER_ID });
    
    const productId = products.length > 0 ? products[0]._id : null;
    
    const claims = [
      {
        sellerId: SELLER_ID,
        productId: productId,
        claimNumber: `CLM-${Date.now()}-1`,
        type: 'return-dispute',
        subject: 'Product defect claim',
        description: 'Customer claims product is defective',
        amount: 1200,
        status: 'under-review',
        priority: 'high'
      },
      {
        sellerId: SELLER_ID,
        productId: productId,
        claimNumber: `CLM-${Date.now()}-2`,
        type: 'product-damage',
        subject: 'Shipping damage complaint',
        description: 'Product damaged during shipping',
        amount: 800,
        status: 'approved',
        priority: 'medium'
      },
      {
        sellerId: SELLER_ID,
        productId: productId,
        claimNumber: `CLM-${Date.now()}-3`,
        type: 'quality-issue',
        subject: 'Fabric quality concern',
        description: 'Customer reports quality issues with fabric',
        amount: 650,
        status: 'submitted',
        priority: 'low'
      }
    ];
    
    for (const claimData of claims) {
      const claim = new Claim(claimData);
      await claim.save();
      console.log(`  ✓ Created claim: ${claim.claimNumber} - ${claim.type} (${claim.status})`);
    }

    // 4. CREATE SUPPORT TICKETS
    console.log('\n💬 Creating Support Ticket records...');
    await Support.deleteMany({ sellerId: SELLER_ID });
    
    const supportTickets = [
      {
        sellerId: SELLER_ID,
        ticketNumber: `TKT-${Date.now()}-1`,
        subject: 'Payment settlement delay',
        description: 'My payment for last week orders is not settled yet',
        category: 'billing',
        priority: 'high',
        status: 'open'
      },
      {
        sellerId: SELLER_ID,
        ticketNumber: `TKT-${Date.now()}-2`,
        subject: 'Product listing issue',
        description: 'Unable to upload new product images',
        category: 'technical',
        priority: 'medium',
        status: 'in-progress'
      },
      {
        sellerId: SELLER_ID,
        ticketNumber: `TKT-${Date.now()}-3`,
        subject: 'How to improve quality score?',
        description: 'Need guidance on improving seller quality metrics',
        category: 'general',
        priority: 'low',
        status: 'resolved'
      }
    ];
    
    for (const ticketData of supportTickets) {
      const ticket = new Support(ticketData);
      await ticket.save();
      console.log(`  ✓ Created ticket: ${ticket.ticketNumber} - ${ticket.subject} (${ticket.status})`);
    }

    // 5. CREATE QUALITY METRICS
    console.log('\n⭐ Creating Quality Metric records...');
    await Quality.deleteMany({ sellerId: SELLER_ID });
    
    const qualityMetrics = [
      {
        sellerId: SELLER_ID,
        productId: productId,
        rating: 4.5,
        reviews: 128,
        returnRate: 3.2,
        defectRate: 1.8,
        customerSatisfaction: 92,
        deliveryPerformance: 95,
        responseTime: 2.5,
        period: 'weekly',
        // qualityScore will be auto-calculated
      },
      {
        sellerId: SELLER_ID,
        productId: productId,
        rating: 4.7,
        reviews: 89,
        returnRate: 2.5,
        defectRate: 1.2,
        customerSatisfaction: 94,
        deliveryPerformance: 97,
        responseTime: 1.8,
        period: 'monthly',
      }
    ];
    
    for (const qualityData of qualityMetrics) {
      const quality = new Quality(qualityData);
      await quality.save();
      console.log(`  ✓ Created quality metric: Rating ${quality.rating}/5, Score: ${quality.qualityScore}/100 (${quality.period})`);
    }

    // 6. CREATE PRICING RECORDS
    console.log('\n💰 Creating Pricing records...');
    await Pricing.deleteMany({ sellerId: SELLER_ID });
    
    const pricingRecords = [
      {
        sellerId: SELLER_ID,
        productId: productId,
        basePrice: 500,
        sellingPrice: 699,
        mrp: 799,
        // margin and discount will be auto-calculated
        isActive: true
      },
      {
        sellerId: SELLER_ID,
        productId: products.length > 1 ? products[1]._id : productId,
        basePrice: 350,
        sellingPrice: 499,
        mrp: 599,
        isActive: true
      },
      {
        sellerId: SELLER_ID,
        productId: products.length > 2 ? products[2]._id : productId,
        basePrice: 200,
        sellingPrice: 299,
        mrp: 349,
        isActive: true
      }
    ];
    
    for (const pricingData of pricingRecords) {
      const pricing = new Pricing(pricingData);
      await pricing.save();
      console.log(`  ✓ Created pricing: Base ₹${pricing.basePrice}, Selling ₹${pricing.sellingPrice}, MRP ₹${pricing.mrp}, Margin: ${pricing.margin}%`);
    }

    // 7. CREATE/UPDATE KYC
    console.log('\n🆔 Creating KYC record...');
    await KYC.deleteMany({ sellerId: SELLER_ID });
    
    const kycData = {
      sellerId: SELLER_ID,
      personalInfo: {
        fullName: 'Lovely Store Owner',
        pan: 'ABCDE1234F',
        aadhaar: '123456789012',
        email: 'owner@lovelystore.com',
        phone: '9876543210'
      },
      businessInfo: {
        businessName: seller.shopName || 'Lovely Store',
        businessType: 'individual',
        gstin: '27ABCDE1234F1Z5',
        businessAddress: '123 Main Street, New Delhi, Delhi 110001'
      },
      bankDetails: {
        accountNumber: '1234567890123456',
        ifscCode: 'SBIN0001234',
        bankName: 'State Bank of India',
        accountHolderName: 'Lovely Store Owner',
        verified: true
      },
      status: 'verified'
    };
    
    const kyc = new KYC(kycData);
    await kyc.save();
    console.log(`  ✓ Created KYC: ${kyc.personalInfo.fullName} - Status: ${kyc.status}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`\n📌 Seller ID: ${SELLER_ID}`);
    console.log(`📌 Store Name: ${seller.shopName}`);
    console.log('\n📊 Data Summary:');
    console.log(`  • Payments: ${payments.length} records`);
    console.log(`  • Warehouses: ${warehouses.length} records`);
    console.log(`  • Claims: ${claims.length} records`);
    console.log(`  • Support Tickets: ${supportTickets.length} records`);
    console.log(`  • Quality Metrics: ${qualityMetrics.length} records`);
    console.log(`  • Pricing: ${pricingRecords.length} records`);
    console.log(`  • KYC: 1 record`);
    console.log('\n🔄 Refresh all pages to see the data!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ MongoDB connection closed');
    process.exit(0);
  }
}

main();
