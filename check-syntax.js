/**
 * Quick syntax check for main files
 */

console.log('Checking backend files...\n');

try {
  console.log('✓ Loading productController...');
  const productController = require('./src/controllers/productController');
  console.log('✓ productController loaded successfully');
  
  console.log('✓ Loading productRoutes...');
  const productRoutes = require('./src/routes/productRoutes');
  console.log('✓ productRoutes loaded successfully');
  
  console.log('✓ Loading auth middleware...');
  const auth = require('./src/middlewares/auth');
  console.log('✓ auth middleware loaded successfully');
  
  console.log('✓ Loading validator...');
  const validator = require('./src/middlewares/validator');
  console.log('✓ validator loaded successfully');
  
  console.log('\n✅ All files loaded successfully! No syntax errors found.');
  console.log('\nYou can now run: npm run dev');
  
} catch (error) {
  console.error('\n❌ Error found:', error.message);
  console.error('\nStack trace:');
  console.error(error.stack);
  process.exit(1);
}
