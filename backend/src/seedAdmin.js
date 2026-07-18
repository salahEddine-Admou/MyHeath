/**
 * Upsert admin only — does not wipe existing users.
 * Usage: npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

async function seedAdmin() {
  await connectDB();

  const email = 'admin@myheath.app';
  let admin = await User.findOne({ email }).select('+password');

  if (!admin) {
    admin = await User.create({
      firstName: 'Platform',
      lastName: 'Admin',
      email,
      password: 'Admin123',
      role: 'admin',
      gender: 'woman',
    });
    console.log('Admin created:', email, '/ Admin123');
  } else {
    admin.role = 'admin';
    admin.firstName = admin.firstName || 'Platform';
    admin.lastName = admin.lastName || 'Admin';
    admin.password = 'Admin123';
    admin.isActive = true;
    await admin.save();
    console.log('Admin updated:', email, '/ Admin123');
  }

  await mongoose.disconnect();
}

seedAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
