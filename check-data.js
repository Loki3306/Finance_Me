import mongoose from 'mongoose';

async function checkData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowfinance';
    await mongoose.connect(mongoUri, { dbName: "flowfinance" });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));

    // Check each collection
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} documents`);
      
      if (count > 0) {
        const sample = await db.collection(collection.name).findOne();
        console.log(`Sample document from ${collection.name}:`, JSON.stringify(sample, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkData();
