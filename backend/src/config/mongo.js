const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/raas-platform';
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000 // Quick timeout if local mongodb instance is not running
    });
    isConnected = true;
    console.log(`🍃 MongoDB Connected: ${mongoose.connection.host}`);
  } catch (error) {
    isConnected = false;
    console.warn(`⚠️ MongoDB Connection Skipped (Using Local File Storage Fallback): ${error.message}`);
  }
};

const isMongoConnected = () => isConnected;

module.exports = { connectDB, isMongoConnected, mongoose };
