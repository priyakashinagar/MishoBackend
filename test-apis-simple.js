/**
 * Simple API Test Script using HTTP requests
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

// Test seller ID (you'll need to replace this with actual seller ID from your DB)
let SELLER_ID = '67585d68c6b0e09283e6253f'; // Replace with your actual seller ID

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testInventoryAPI() {
  try {
    log('\n🧪 Testing Inventory API...', 'blue');
    
    // GET all inventory
    const response = await axios.get(`${API_URL}/inventory`, {
      params: { sellerId: SELLER_ID }
    });
    
    log(`✅ GET /inventory - ${response.data.data.inventory.length} items found`, 'green');
    log(`   Stats: ${JSON.stringify(response.data.data.stats)}`, 'yellow');
    
    return true;
  } catch (error) {
    log(`❌ Inventory API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testPaymentAPI() {
  try {
    log('\n🧪 Testing Payment API...', 'blue');
    
    const response = await axios.get(`${API_URL}/payments`, {
      params: { sellerId: SELLER_ID }
    });
    
    log(`✅ GET /payments - ${response.data.data.payments.length} payments found`, 'green');
    log(`   Stats: ${JSON.stringify(response.data.data.stats)}`, 'yellow');
    
    return true;
  } catch (error) {
    log(`❌ Payment API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testWarehouseAPI() {
  try {
    log('\n🧪 Testing Warehouse API...', 'blue');
    
    const response = await axios.get(`${API_URL}/warehouses`, {
      params: { sellerId: SELLER_ID }
    });
    
    log(`✅ GET /warehouses - ${response.data.data.warehouses.length} warehouses found`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Warehouse API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testClaimAPI() {
  try {
    log('\n🧪 Testing Claim API...', 'blue');
    
    const response = await axios.get(`${API_URL}/claims`, {
      params: { sellerId: SELLER_ID }
    });
    
    log(`✅ GET /claims - ${response.data.data.claims.length} claims found`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Claim API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testSupportAPI() {
  try {
    log('\n🧪 Testing Support API...', 'blue');
    
    const response = await axios.get(`${API_URL}/support`, {
      params: { sellerId: SELLER_ID }
    });
    
    log(`✅ GET /support - ${response.data.data.tickets.length} tickets found`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Support API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testQualityAPI() {
  try {
    log('\n🧪 Testing Quality API...', 'blue');
    
    const response = await axios.get(`${API_URL}/quality`, {
      params: { sellerId: SELLER_ID }
    });
    
    log(`✅ GET /quality - ${response.data.data.metrics.length} quality metrics found`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Quality API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testPricingAPI() {
  try {
    log('\n🧪 Testing Pricing API...', 'blue');
    
    const response = await axios.get(`${API_URL}/pricing`, {
      params: { sellerId: SELLER_ID }
    });
    
    log(`✅ GET /pricing - ${response.data.data.pricing.length} pricing records found`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ Pricing API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testKYCAPI() {
  try {
    log('\n🧪 Testing KYC API...', 'blue');
    
    const response = await axios.get(`${API_URL}/kyc`, {
      params: { sellerId: SELLER_ID }
    });
    
    log(`✅ GET /kyc - Status: ${response.data.data.kyc?.verificationStatus || 'No KYC data'}`, 'green');
    
    return true;
  } catch (error) {
    log(`❌ KYC API failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Response: ${JSON.stringify(error.response.data)}`, 'red');
    }
    return false;
  }
}

async function testHealthCheck() {
  try {
    log('\n🏥 Testing Server Health...', 'blue');
    
    const response = await axios.get('http://localhost:5000/health');
    
    log(`✅ Server is healthy - ${response.data.message}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Server health check failed: ${error.message}`, 'red');
    log('   Make sure backend server is running on port 5000', 'yellow');
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'magenta');
  log('🚀 MEESHO SELLER PANEL API TESTING', 'magenta');
  log('='.repeat(60) + '\n', 'magenta');
  
  log(`📍 Testing against: ${API_URL}`, 'yellow');
  log(`👤 Seller ID: ${SELLER_ID}\n`, 'yellow');
  
  // Test server health first
  const serverOk = await testHealthCheck();
  if (!serverOk) {
    log('\n❌ Cannot proceed - Server is not running!', 'red');
    log('   Run: node server.js', 'yellow');
    return;
  }
  
  const results = {
    passed: 0,
    failed: 0
  };
  
  // Run all tests
  const tests = [
    testInventoryAPI,
    testPaymentAPI,
    testWarehouseAPI,
    testClaimAPI,
    testSupportAPI,
    testQualityAPI,
    testPricingAPI,
    testKYCAPI
  ];
  
  for (const test of tests) {
    const result = await test();
    if (result) {
      results.passed++;
    } else {
      results.failed++;
    }
  }
  
  // Summary
  log('\n' + '='.repeat(60), 'magenta');
  log('📊 TEST SUMMARY', 'magenta');
  log('='.repeat(60), 'magenta');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`, 'yellow');
  log('='.repeat(60) + '\n', 'magenta');
  
  if (results.failed === 0) {
    log('🎉 ALL APIS WORKING PERFECTLY!', 'green');
    log('💡 Now you can test the frontend pages!', 'blue');
  } else {
    log('⚠️  Some APIs need attention', 'yellow');
    log('💡 Check error messages above for details', 'blue');
  }
}

// Run tests
runTests().catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
