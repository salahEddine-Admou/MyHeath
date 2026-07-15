const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retries = MAX_RETRIES) => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/heracare';

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`[HeraCare] MongoDB connecté : ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.error(
        `[HeraCare] Échec connexion MongoDB (tentative ${attempt}/${retries}) :`,
        error.message
      );
      if (attempt === retries) {
        console.error('[HeraCare] Impossible de se connecter à MongoDB. Arrêt.');
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

module.exports = connectDB;
