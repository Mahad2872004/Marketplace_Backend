const mongoose = require('mongoose');
const Category = require('../models/Category');
require('dotenv').config();

const createCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-marketplace');
    console.log('✅ Connected to MongoDB');

    const categories = [
      {
        name: "Plumbing",
        nameUrdu: "پلمبر",
        slug: "plumbing",
        icon: "plumbing",
        isActive: true,
        sortOrder: 1
      },
      {
        name: "Electrical",
        nameUrdu: "بجلی",
        slug: "electrical",
        icon: "electrical",
        isActive: true,
        sortOrder: 2
      },
      {
        name: "Carpentry",
        nameUrdu: "بڑھئی",
        slug: "carpentry",
        icon: "carpentry",
        isActive: true,
        sortOrder: 3
      },
      {
        name: "Cleaning",
        nameUrdu: "صفائی",
        slug: "cleaning",
        icon: "cleaning",
        isActive: true,
        sortOrder: 4
      }
    ];

    // Check if categories already exist
    const existingCategories = await Category.find({});
    if (existingCategories.length > 0) {
      console.log('⚠️  Categories already exist. Updating existing categories...');
      
      // Update or create each category
      for (const categoryData of categories) {
        const existing = await Category.findOne({ slug: categoryData.slug });
        if (existing) {
          await Category.findByIdAndUpdate(existing._id, categoryData, { new: true });
          console.log(`✅ Updated category: ${categoryData.name}`);
        } else {
          await Category.create(categoryData);
          console.log(`✅ Created category: ${categoryData.name}`);
        }
      }
    } else {
      // Create all categories
      const createdCategories = await Category.insertMany(categories);
      console.log(`✅ Created ${createdCategories.length} categories successfully!`);
      
      createdCategories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.nameUrdu})`);
      });
    }

    console.log('\n✅ Categories setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating categories:', error);
    if (error.code === 11000) {
      console.error('Duplicate category found. Some categories may already exist.');
    }
    process.exit(1);
  }
};

createCategories();


