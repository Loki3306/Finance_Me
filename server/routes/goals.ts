import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../db";
import { Goal } from "../models/goal";
import { getUserId, requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  targetAmount: z.number(),
  currentAmount: z.number().optional(),
  targetDate: z.coerce.date().optional(),
  category: z.string().optional(),
  priority: z.enum(["high", "medium", "low"]).optional(),
  imageUrl: z.string().optional(),
});

router.get("/", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const docs = await Goal.find({ userId }).sort({ createdAt: -1 });
  res.json(docs);
});

router.post("/", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await Goal.create({ ...parsed.data, userId });
  res.status(201).json(doc);
});

router.put("/:id", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await Goal.findOneAndUpdate({ _id: req.params.id, userId }, parsed.data, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

router.post("/:id/contribute", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const { amount, accountId } = z.object({ amount: z.number(), accountId: z.string().optional() }).parse(req.body);
  const goal = await Goal.findOne({ _id: req.params.id, userId });
  if (!goal) return res.status(404).json({ error: "Not found" });
  goal.currentAmount += amount;
  goal.contributionHistory.push({ amount, date: new Date(), accountId } as any);
  if (goal.currentAmount >= goal.targetAmount) goal.isCompleted = true;
  await goal.save();
  res.json(goal);
});

router.put("/:id/complete", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const doc = await Goal.findOneAndUpdate({ _id: req.params.id, userId }, { isCompleted: true }, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

router.get("/summary", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const agg = await Goal.aggregate([
    { $match: { userId } },
    { $group: { _id: "$isCompleted", count: { $sum: 1 } } },
  ]);
  res.json(agg);
});

router.delete("/:id", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  await Goal.deleteOne({ _id: req.params.id, userId });
  res.json({ success: true });
});

export default router;
