import mongoose, { Schema } from "mongoose";

const BudgetSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    amount: { type: Number, required: true },
    period: { type: String, enum: ["weekly", "monthly", "quarterly", "yearly"], required: true },
    startDate: { type: Date },
    endDate: { type: Date },
    alertThresholds: {
      warning: { type: Number, default: 80 },
      danger: { type: Number, default: 95 },
    },
    isRecurring: { type: Boolean, default: true },
    accountTypes: [{ type: String }],
    isActive: { type: Boolean, default: true },
    spentAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

BudgetSchema.index({ userId: 1, isActive: 1 });

export const Budget = mongoose.models.Budget || mongoose.model("Budget", BudgetSchema);
