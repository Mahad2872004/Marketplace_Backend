const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-marketplace');
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'mahadmateenbutt@gmail.com';
    const adminPassword = 'Butt2828';
    const adminName = 'Mahad Mateen Butt';
    const adminPhone = '+923001234567'; // Update this with your actual phone number

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists with this email');
      console.log('Updating existing user to admin role...');
      
      // Update existing user to admin
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.isVerified = true;
      existingAdmin.password = adminPassword; // Will be hashed automatically
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully!');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: ${adminPassword}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword, // Will be hashed automatically by the model
      role: 'admin',
      isActive: true,
      isVerified: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Name: ${adminName}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    if (error.code === 11000) {
      console.error('Email or phone number already exists. Please use a different one.');
    }
    process.exit(1);
  }
};

createAdmin();

