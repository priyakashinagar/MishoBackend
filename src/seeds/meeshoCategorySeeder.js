/**
 * Meesho Category Seeder - Adds all Meesho categories with proper hierarchy
 * Level 0 = Parent Categories (shown in navbar)
 * Level 1 = Subcategories (shown in dropdown)
 * Level 2 = Child Categories (products belong to these)
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');

// Helper to create slug
const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[&]/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Meesho Categories Structure
const meeshoCategories = {
  // Parent Category: Popular (Featured categories)
  'Popular': {
    subcategories: {
      'Featured On Meesho': ['Smartphones', 'Top Brands', 'Shimla Apples'],
      'All Popular': ['Jewellery', 'Men Fashion', 'Kids', 'Footwear', 'Beauty & Personal Care', 'Grocery', 'Electronics', 'Innerwear & Nightwear', 'Kitchen & Appliances', 'Bags & Luggage', 'Healthcare']
    }
  },
  
  // Parent Category: Fashion (General fashion items)
  'Fashion': {
    subcategories: {
      'Women Fashion': ['Sarees', 'Kurtis', 'Tops', 'Dresses', 'Jeans', 'Ethnic Wear'],
      'Men Fashion': ['T-Shirts', 'Shirts', 'Jeans', 'Trousers', 'Kurtas', 'Jackets'],
      'Kids Fashion': ['Boys Clothing', 'Girls Clothing', 'Baby Clothing'],
      'Accessories': ['Watches', 'Bags', 'Belts', 'Sunglasses', 'Jewellery']
    }
  },
  
  // Parent Category: Cosmetic
  'Cosmetic': {
    subcategories: {
      'Face Makeup': ['Foundation', 'Concealer', 'Compact Powder', 'Blush', 'Highlighter', 'Setting Spray'],
      'Eye Makeup': ['Eyeliner', 'Mascara', 'Eye Shadow', 'Eyebrow Pencil', 'Kajal', 'False Eyelashes'],
      'Lip Makeup': ['Lipstick', 'Lip Gloss', 'Lip Liner', 'Lip Balm', 'Lip Stain'],
      'Nail Care': ['Nail Polish', 'Nail Art', 'Nail Tools', 'Nail Remover'],
      'Makeup Tools': ['Makeup Brushes', 'Makeup Sponges', 'Makeup Organizers', 'Makeup Mirrors']
    }
  },
  
  // Parent Category: Kurti, Saree & Lehenga (Women Ethnic)
  'Kurti, Saree & Lehenga': {
    subcategories: {
      'Sarees': ['All Sarees', 'Georgette Sarees', 'Chiffon Sarees', 'Cotton Sarees', 'Net Sarees', 'Silk Sarees', 'New Collection'],
      'Kurtis': ['All Kurtis', 'Anarkali Kurtis', 'Rayon Kurtis', 'Cotton Kurtis', 'Straight Kurtis', 'Long Kurtis'],
      'Kurta Sets': ['All Kurta Sets', 'Kurta Palazzo Sets', 'Kurta Pant Sets', 'Sharara Sets', 'Anarkali Kurta Sets', 'Cotton Kurta Sets'],
      'Dupatta Sets': ['All Dupatta Sets', 'Cotton Sets', 'Rayon Sets'],
      'Lehengas': ['Bridal Lehengas', 'Party Wear Lehengas', 'Cotton Lehengas'],
      'Blouses': ['Ready Made Blouses', 'Designer Blouses', 'Padded Blouses'],
      'Gowns': ['Anarkali Gowns', 'Party Wear Gowns', 'Casual Gowns'],
      'Other Ethnic': ['Palazzos', 'Dupattas', 'Shawls']
    }
  },
  
  // Parent Category: Women Western
  'Women Western': {
    subcategories: {
      'Topwear': ['All Topwear', 'Tops & Tunics', 'Dresses', 'T-shirts', 'Gowns', 'Tops & Bottom Sets', 'Shirts'],
      'Bottom Wear': ['All Bottomwear', 'Jeans & Jeggings', 'Palazzos', 'Trousers & Pants', 'Leggings', 'Shorts & Skirts'],
      'Winterwear': ['Jackets', 'Sweatshirts', 'Sweaters', 'Capes, Shrug & Ponchos', 'Coats', 'Blazers & Waistcoats'],
      'Plus Size': ['Plus Size - Dresses & Gowns', 'Plus Size - Tops & Tees', 'Plus size - Bottomwear']
    }
  },
  
  // Parent Category: Lingerie
  'Lingerie': {
    subcategories: {
      'Innerwear': ['Women Bra', 'Women Panties', 'Other Innerwear'],
      'Sleepwear': ['Women Nightsuits', 'Women Nightdress', 'Other Sleepwear'],
      'Sports Wear': ['Sports Bottomwear', 'Sports Bra', 'Top & Bottom Sets'],
      'Maternity Wear': ['Kurti & Topwear', 'Feeding Bras', 'Briefs & Bottomwear']
    }
  },
  
  // Parent Category: Men
  'Men': {
    subcategories: {
      'Top Wear': ['Summer T-Shirts', 'Shirts', 'T-Shirts', 'T-Shirts Combos'],
      'Bottom Wear': ['Jeans', 'Cargos/Trousers', 'Dhotis/Lungis'],
      'Ethnic Wear': ['Kurtas', 'Kurta Sets', 'Nehru Jacket'],
      'Innerwear': ['Vests', 'Briefs', 'Boxers'],
      'Sports Wear': ['Trackpants', 'Tracksuits', 'Gym Tshirts'],
      'Night Wear': ['Pyjamas', 'Night Shorts', 'Nightsuits'],
      'Winter Wear': ['Shrugs', 'Jackets', 'Sweatshirts'],
      'Combo Store': ['All Rakhi Specials', 'Shirts Combo', 'Innerwear Combo'],
      'Accessories': ['All Accessories', 'Watches', 'Wallets'],
      'Footwear': ['Men Footwear', 'Men Casual Shoes', 'Men Sports Shoes']
    }
  },
  
  // Parent Category: Kids & Toys
  'Kids & Toys': {
    subcategories: {
      'Boys Clothing': ['T-Shirts', 'Shirts', 'Jeans', 'Shorts', 'Ethnic Wear'],
      'Girls Clothing': ['Dresses', 'Tops', 'Leggings', 'Ethnic Wear', 'Skirts'],
      'Infant Clothing': ['Rompers', 'Bodysuits', 'Sets', 'Dresses'],
      'Kids Footwear': ['Boys Footwear', 'Girls Footwear', 'Infant Footwear'],
      'Toys': ['Soft Toys', 'Educational Toys', 'Action Figures', 'Board Games']
    }
  },
  
  // Parent Category: Home & Kitchen
  'Home & Kitchen': {
    subcategories: {
      'Kitchen & Dining': ['Cookware', 'Kitchen Tools', 'Storage Containers', 'Kitchen Appliances'],
      'Home Decor': ['Wall Decor', 'Showpieces', 'Photo Frames', 'Clocks'],
      'Bedding': ['Bedsheets', 'Pillows & Covers', 'Blankets', 'Mattress Protectors'],
      'Bath': ['Towels', 'Bath Accessories', 'Bathroom Organizers'],
      'Furnishing': ['Curtains', 'Cushion Covers', 'Sofa Covers', 'Carpets & Rugs'],
      'Lighting': ['LED Lights', 'Table Lamps', 'Decorative Lights']
    }
  },
  
  // Parent Category: Beauty & Health
  'Beauty & Health': {
    subcategories: {
      'Makeup': ['Lipstick', 'Foundation', 'Mascara', 'Eyeliner', 'Nail Polish'],
      'Skincare': ['Face Wash', 'Moisturizers', 'Sunscreen', 'Face Masks', 'Serums'],
      'Haircare': ['Shampoo', 'Conditioner', 'Hair Oil', 'Hair Color'],
      'Personal Care': ['Deodorants', 'Perfumes', 'Body Wash', 'Oral Care'],
      'Health Devices': ['BP Monitors', 'Weighing Scales', 'Thermometers']
    }
  },
  
  // Parent Category: Jewellery & Accessories
  'Jewellery & Accessories': {
    subcategories: {
      'Fashion Jewellery': ['Necklaces', 'Earrings', 'Bracelets', 'Rings', 'Anklets'],
      'Gold Plated': ['Gold Plated Necklaces', 'Gold Plated Earrings', 'Gold Plated Bangles'],
      'Silver Jewellery': ['Silver Earrings', 'Silver Rings', 'Silver Pendants'],
      'Hair Accessories': ['Hair Clips', 'Hair Bands', 'Hair Pins'],
      'Watches': ['Women Watches', 'Men Watches', 'Smart Watches']
    }
  },
  
  // Parent Category: Bags
  'Bags': {
    subcategories: {
      'Women Bags': ['Handbags', 'Sling Bags', 'Tote Bags', 'Clutches'],
      'Men Bags': ['Backpacks', 'Messenger Bags', 'Laptop Bags'],
      'Travel Bags': ['Luggage', 'Duffel Bags', 'Travel Accessories']
    }
  },
  
  // Parent Category: Footwear
  'Footwear': {
    subcategories: {
      'Women Footwear': ['Flats', 'Heels', 'Wedges', 'Sandals', 'Sports Shoes'],
      'Men Footwear': ['Casual Shoes', 'Formal Shoes', 'Sports Shoes', 'Sandals', 'Slippers'],
      'Kids Footwear': ['Boys Shoes', 'Girls Shoes', 'School Shoes']
    }
  },
  
  // Parent Category: Electronics
  'Electronics': {
    subcategories: {
      'Mobile Accessories': ['Mobile Covers', 'Screen Guards', 'Chargers', 'Power Banks', 'Cables'],
      'Audio': ['Earphones', 'Headphones', 'Bluetooth Speakers', 'TWS Earbuds'],
      'Computer Accessories': ['Mouse', 'Keyboard', 'USB Hubs', 'Laptop Bags'],
      'Smart Devices': ['Smart Watches', 'Fitness Bands', 'Smart Home Devices']
    }
  }
};

async function seedCategories() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    let parentCount = 0;
    let subCount = 0;
    let childCount = 0;
    let skipped = 0;
    
    for (const [parentName, data] of Object.entries(meeshoCategories)) {
      // Check if parent already exists
      let parent = await Category.findOne({ 
        name: { $regex: new RegExp(`^${parentName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });
      
      if (!parent) {
        try {
          parent = await Category.create({
            name: parentName,
            slug: createSlug(parentName),
            level: 0,
            parent: null,
            isActive: true,
            order: parentCount,
            commission: 10 // Default 10% commission
          });
          console.log(`✅ Created parent: ${parentName}`);
          parentCount++;
        } catch (err) {
          if (err.code === 11000) {
            parent = await Category.findOne({ name: { $regex: new RegExp(`^${parentName}`, 'i') } });
            console.log(`⏭️ Parent exists (duplicate): ${parentName}`);
            skipped++;
          } else throw err;
        }
      } else {
        // Update level if needed
        if (parent.level !== 0) {
          parent.level = 0;
          await parent.save();
        }
        console.log(`⏭️ Parent exists: ${parentName}`);
        skipped++;
      }
      
      if (!parent) continue;
      
      // Create subcategories
      for (const [subName, children] of Object.entries(data.subcategories)) {
        let subcategory = await Category.findOne({ 
          name: { $regex: new RegExp(`^${subName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        
        if (!subcategory) {
          try {
            subcategory = await Category.create({
              name: subName,
              slug: createSlug(`${parentName}-${subName}`),
              level: 1,
              parent: parent._id,
              isActive: true,
              order: subCount,
              commission: 10
            });
            console.log(`  ✅ Created subcategory: ${subName}`);
            subCount++;
          } catch (err) {
            if (err.code === 11000) {
              subcategory = await Category.findOne({ name: { $regex: new RegExp(`^${subName}`, 'i') } });
              // Update parent if it exists but has wrong parent
              if (subcategory && subcategory.level !== 1) {
                subcategory.level = 1;
                subcategory.parent = parent._id;
                await subcategory.save();
              }
              console.log(`  ⏭️ Subcategory exists: ${subName}`);
              skipped++;
            } else throw err;
          }
        } else {
          // Update to correct level and parent if needed
          if (subcategory.level !== 1 || !subcategory.parent) {
            subcategory.level = 1;
            subcategory.parent = parent._id;
            await subcategory.save();
          }
          console.log(`  ⏭️ Subcategory exists: ${subName}`);
          skipped++;
        }
        
        if (!subcategory) continue;
        
        // Create child categories
        for (const childName of children) {
          const existingChild = await Category.findOne({ 
            name: { $regex: new RegExp(`^${childName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
          });
          
          if (!existingChild) {
            try {
              await Category.create({
                name: childName,
                slug: createSlug(`${subName}-${childName}`),
                level: 2,
                parent: subcategory._id,
                isActive: true,
                order: childCount,
                commission: 10
              });
              console.log(`    ✅ Created child: ${childName}`);
              childCount++;
            } catch (err) {
              if (err.code === 11000) {
                console.log(`    ⏭️ Child exists: ${childName}`);
                skipped++;
              } else throw err;
            }
          } else {
            // Update to correct level and parent if needed
            if (existingChild.level !== 2 || !existingChild.parent) {
              existingChild.level = 2;
              existingChild.parent = subcategory._id;
              await existingChild.save();
            }
            console.log(`    ⏭️ Child exists: ${childName}`);
            skipped++;
          }
        }
      }
    }
    
    console.log('\n========================================');
    console.log(`✅ Seeding Complete!`);
    console.log(`   Parents created: ${parentCount}`);
    console.log(`   Subcategories created: ${subCount}`);
    console.log(`   Child categories created: ${childCount}`);
    console.log(`   Skipped (already exist): ${skipped}`);
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
