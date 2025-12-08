const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./src/models/Category');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Check if 'Summer T Shirts' exists
  const allCats = await Category.find({}).lean();
  const summerRelated = allCats.filter(c => 
    c.name.toLowerCase().includes('summer') || 
    c.name.toLowerCase().includes('t-shirt') ||
    c.name.toLowerCase().includes('tshirt')
  );
  console.log('Summer/T-Shirt related categories:', summerRelated.map(c => ({ name: c.name, level: c.level })));
  
  // Check Men category structure
  const men = await Category.findOne({ name: 'Men', level: 0 }).lean();
  console.log('\nMen category ID:', men ? men._id : 'NOT FOUND');
  
  if (men) {
    const menSubs = await Category.find({ parent: men._id }).lean();
    console.log('\nMen subcategories (level 1):');
    for (const sub of menSubs) {
      console.log(`  - ${sub.name}`);
      const children = await Category.find({ parent: sub._id }).lean();
      if (children.length) {
        console.log(`    Children: ${children.map(c => c.name).join(', ')}`);
      }
    }
  }
  
  // Test the query that would be made for "summer-t-shirts"
  console.log('\n--- Testing search for "summer t shirts" ---');
  const searchName = 'summer t shirts';
  const found = await Category.findOne({ 
    name: { $regex: new RegExp(`^${searchName}$`, 'i') }
  });
  console.log('Found by exact name:', found ? found.name : 'NOT FOUND');
  
  // Try partial match
  const partial = await Category.find({ 
    name: { $regex: /summer/i }
  }).lean();
  console.log('Found by partial "summer":', partial.map(c => c.name));
  
  process.exit(0);
}

check();
