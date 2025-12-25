const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const checkUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-marketplace');
    console.log('✅ Connected to MongoDB\n');

    const email = 'mahadmateenhut@gmail.com';
    const phone = '03219129363';

    // Check by email
    const userByEmail = await User.findOne({ email });
    if (userByEmail) {
      console.log('📧 User found by email:');
      console.log(`   Name: ${userByEmail.name}`);
      console.log(`   Email: ${userByEmail.email}`);
      console.log(`   Phone: ${userByEmail.phone}`);
      console.log(`   Role: ${userByEmail.role}`);
      console.log(`   ID: ${userByEmail._id}`);
    } else {
      console.log('📧 No user found with email:', email);
    }

    // Check by phone
    const userByPhone = await User.findOne({ phone });
    if (userByPhone) {
      console.log('\n📱 User found by phone:');
      console.log(`   Name: ${userByPhone.name}`);
      console.log(`   Email: ${userByPhone.email}`);
      console.log(`   Phone: ${userByPhone.phone}`);
      console.log(`   Role: ${userByPhone.role}`);
      console.log(`   ID: ${userByPhone._id}`);
    } else {
      console.log('\n📱 No user found with phone:', phone);
    }

    // Check all users
    const allUsers = await User.find({}).select('name email phone role');
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log('\nAll users:');
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkUser();


