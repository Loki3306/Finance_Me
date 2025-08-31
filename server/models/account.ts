import mongoose, { Schema, Types } from "mongoose";

export type AccountType = "cash" | "upi" | "credit_card" | "bank";

const AccountSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["cash", "upi", "credit_card", "bank"],
      required: true,
    },
    subType: { type: String },
    balance: { type: Number, required: true, default: 0 },
    creditLimit: { type: Number },
    upiId: { type: String },
    paymentDueDate: { type: Number, min: 1, max: 31 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

AccountSchema.index({ userId: 1, type: 1 });

export const Account =
  mongoose.models.Account || mongoose.model("Account", AccountSchema);
