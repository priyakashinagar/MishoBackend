/**
 * Check reviews in database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Rating = require('./src/models/Rating');
const User = require('./src/models/User');
const Product = require('./src/models/Product');

async function checkReviews() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ Connected to MongoDB\n');

    const totalReviews = await Rating.countDocuments();
    console.log(`⭐ Total reviews in database: ${totalReviews}\n`);

    if (totalReviews > 0) {
      const reviews = await Rating.find()
        .populate('user', 'name email')
        .populate('product', 'name')
        .limit(5)
        .sort({ createdAt: -1 });

      console.log('Recent reviews:');
      reviews.forEach((review, i) => {
        console.log(`\n${i + 1}. Rating: ${review.rating}/5`);
        console.log(`   User: ${review.user?.name || 'N/A'}`);
        console.log(`   Product: ${review.product?.name || 'N/A'}`);
        console.log(`   Comment: ${review.comment || 'No comment'}`);
        console.log(`   Created: ${review.createdAt}`);
      });
    } else {
      console.log('⚠️ No reviews found in database!');
      console.log('\nTo create reviews:');
      console.log('1. User website se product page pe jao');
      console.log('2. Order deliver hone ke baad review submit karo');
    }

    await mongoose.connection.close();
    console.log('\n✓ MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkReviews();
