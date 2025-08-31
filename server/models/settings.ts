import mongoose, { Schema } from "mongoose";

const SettingsSchema = new Schema(
  {
    userId: { type: String, unique: true, required: true },
    preferences: {
      currency: { type: String, default: "INR" },
      dateFormat: { type: String, default: "DD/MM/YYYY" },
      fiscalYearStart: { type: String, default: "April" },
      dashboardWidgets: [{ type: String }],
      notifications: {
        budgetAlerts: { type: Boolean, default: true },
        goalReminders: { type: Boolean, default: true },
        weeklyReports: { type: Boolean, default: false },
      },
      privacy: {
        dataRetention: { type: Number, default: 365 },
        shareAnalytics: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true },
);

export const Settings =
  mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
