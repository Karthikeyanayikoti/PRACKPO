const mongoose = require("mongoose");
require("dotenv").config();

const Payment = require("./models/Payment");

async function fixIndexes() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/smart-water-supply");
    
    console.log("Dropping Payment collection...");
    try {
      await Payment.collection.drop();
      console.log("✅ Collection dropped");
    } catch (e) {
      console.log("Collection doesn't exist (first run)");
    }
    
    console.log("Syncing indexes from schema...");
    await Payment.syncIndexes();
    
    console.log("✅ Collection and indexes recreated successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixIndexes();
