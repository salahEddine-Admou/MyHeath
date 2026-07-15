const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retries = MAX_RETRIES) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myheath';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`[MyHeath] MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(
        `[MyHeath] MongoDB connection failed (attempt ${attempt}/${retries}):`,
        error.message
      );
      if (attempt === retries) {
        console.error('[MyHeath] Could not connect to MongoDB.');
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

module.exports = connectDB;
