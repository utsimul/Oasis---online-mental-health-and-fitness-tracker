const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/mern_database", {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Using database: ${conn.connection.db.databaseName}`);
    console.log(`Collections: ${(await conn.connection.db.listCollections().toArray()).map(c => c.name)}`);

  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Connection URI used:', process.env.MONGO_URI || "mongodb://localhost:27017/mern_database");
    process.exit(1);
  }
};

module.exports = connectDB;