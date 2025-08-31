import mongoose, { Schema, Types } from "mongoose";

const TransactionSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account", required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["income", "expense", "transfer"], required: true },
    category: { type: String, required: true },
    subCategory: { type: String },
    description: { type: String },
    date: { type: Date, required: true },
    transferAccountId: { type: Schema.Types.ObjectId, ref: "Account" },
    paymentMethod: { type: String },
    notes: { type: String },
    receiptUrl: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, accountId: 1 });

export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);
