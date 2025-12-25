const mongoose = require('mongoose');
const User = require('../models/User');
const Worker = require('../models/Worker');
require('dotenv').config();

const deleteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/service-marketplace');
    console.log('✅ Connected to MongoDB\n');

    // Get email/phone from command line arguments or use defaults
    const email = process.argv[2] || 'mahadmateenhut@gmail.com';
    const phone = process.argv[3] || '03219129363';

    console.log(`Looking for user with email: ${email} or phone: ${phone}\n`);

    // Find user
    const user = await User.findOne({ $or: [{ email }, { phone }] });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(0);
    }

    console.log('Found user:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Phone: ${user.phone}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   ID: ${user._id}\n`);

    // Delete worker profile if exists
    if (user.role === 'worker') {
      const worker = await Worker.findOne({ userId: user._id });
      if (worker) {
        await Worker.findByIdAndDelete(worker._id);
        console.log('✅ Deleted worker profile');
      }
    }

    // Delete user
    await User.findByIdAndDelete(user._id);
    console.log('✅ User deleted successfully');
    console.log('\nYou can now register again with the same email/phone.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

deleteUser();


