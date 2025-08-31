import mongoose, { Schema } from "mongoose";

const ContributionSchema = new Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    accountId: { type: Schema.Types.ObjectId, ref: "Account" },
  },
  { _id: false },
);

const GoalSchema = new Schema(
  {
    userId: { type: String, index: true, required: true },
    name: { type: String, required: true },
    description: { type: String },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    targetDate: { type: Date },
    category: { type: String },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
    },
    imageUrl: { type: String },
    contributionHistory: [ContributionSchema],
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

GoalSchema.index({ userId: 1, isCompleted: 1 });

export const Goal = mongoose.models.Goal || mongoose.model("Goal", GoalSchema);
