import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../db";
import { Settings } from "../models/settings";
import { getUserId, requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/preferences", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  let doc = await Settings.findOne({ userId });
  if (!doc) doc = await Settings.create({ userId, preferences: {} });
  res.json(doc);
});

const prefSchema = z.object({
  preferences: z.object({
    currency: z.string().optional(),
    dateFormat: z.string().optional(),
    fiscalYearStart: z.string().optional(),
    dashboardWidgets: z.array(z.string()).optional(),
    notifications: z
      .object({ budgetAlerts: z.boolean(), goalReminders: z.boolean(), weeklyReports: z.boolean() })
      .partial()
      .optional(),
    privacy: z.object({ dataRetention: z.number(), shareAnalytics: z.boolean() }).partial().optional(),
  }),
});

router.put("/preferences", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = prefSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await Settings.findOneAndUpdate(
    { userId },
    { $set: Object.fromEntries(Object.entries(parsed.data.preferences).map(([k, v]) => ["preferences." + k, v])) },
    { new: true, upsert: true },
  );
  res.json(doc);
});

router.post("/export", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const doc = await Settings.findOne({ userId });
  res.json(doc || {});
});

router.get("/stats", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const { Account } = await import("../models/account");
  const { Transaction } = await import("../models/transaction");
  const { Goal } = await import("../models/goal");
  res.json({
    accountsCount: await Account.countDocuments({ userId, deletedAt: null }),
    transactionsCount: await Transaction.countDocuments({ userId, isDeleted: false }),
    goalsCount: await Goal.countDocuments({ userId }),
  });
});

router.delete("/reset", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  await Settings.deleteOne({ userId });
  res.json({ success: true });
});

export default router;
