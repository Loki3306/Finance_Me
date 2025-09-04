

import mongoose, { Schema } from 'mongoose';

// Clear existing model and collection if it exists
if (mongoose.models.Budget) {
  delete mongoose.models.Budget;
}

// Force drop the collection to remove all indexes
mongoose.connection.once('open', async () => {
  try {
    await mongoose.connection.db.collection('budgets').drop();
    console.log('Dropped budgets collection to reset indexes');
  } catch (e) {
    console.log('Collection does not exist or already dropped');
  }
});

const BudgetSchema = new Schema({
  userId: { type: String, index: true, required: true },
  name: { type: String, required: true, maxlength: 50 }, // NO UNIQUE CONSTRAINT
  budgetType: { type: String, enum: ['category', 'account', 'overall'], required: true },
  scope: {
    categories: [{ type: String }],
    accountTypes: [{ type: String }],
    accountIds: [{ type: String }],
  },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], required: true },
  description: { type: String },
  alertThresholds: {
    warning: { type: Number, default: 80 },
    critical: { type: Number, default: 100 },
  },
  rollover: {
    enabled: { type: Boolean, default: false },
    type: { type: String, enum: ['remaining', 'overspend'], default: 'remaining' },
  },
  currentPeriod: {
    spentAmount: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
    lastCalculated: { type: Date },
    progressPercentage: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Only create non-unique indexes
BudgetSchema.index({ userId: 1, isActive: 1 });
BudgetSchema.index({ userId: 1, name: 1 }); // Allow same name for different users

export default mongoose.model('Budget', BudgetSchema);
