import mongoose from 'mongoose';

async function clearAllData() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowfinance';
    await mongoose.connect(mongoUri, { dbName: "flowfinance" });
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Delete all transactions
    const transactionsResult = await db.collection('transactions').deleteMany({});
    console.log(`Deleted ${transactionsResult.deletedCount} transactions`);

    // Delete all accounts
    const accountsResult = await db.collection('accounts').deleteMany({});
    console.log(`Deleted ${accountsResult.deletedCount} accounts`);

    // Delete all budgets
    const budgetsResult = await db.collection('budgets').deleteMany({});
    console.log(`Deleted ${budgetsResult.deletedCount} budgets`);

    // Delete all goals (if any)
    const goalsResult = await db.collection('goals').deleteMany({});
    console.log(`Deleted ${goalsResult.deletedCount} goals`);

    // Delete all users (if any)
    const usersResult = await db.collection('users').deleteMany({});
    console.log(`Deleted ${usersResult.deletedCount} users`);

    console.log('✅ All data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearAllData();
