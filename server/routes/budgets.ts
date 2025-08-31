import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../db";
import { Budget } from "../models/budget";
import { Transaction } from "../models/transaction";
import { getUserId, requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const schema = z.object({
  name: z.string().min(2),
  category: z.string(),
  subCategory: z.string().optional(),
  amount: z.number(),
  period: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  alertThresholds: z
    .object({ warning: z.number().default(80), danger: z.number().default(95) })
    .optional(),
  isRecurring: z.boolean().optional(),
  accountTypes: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

router.get("/", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const docs = await Budget.find({ userId }).sort({ createdAt: -1 });
  res.json(docs);
});

router.get("/active", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const now = new Date();
  const docs = await Budget.find({
    userId,
    isActive: true,
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  });
  res.json(docs);
});

router.post("/", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await Budget.create({ ...parsed.data, userId });
  res.status(201).json(doc);
});

router.put("/:id", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = schema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId },
    parsed.data,
    { new: true },
  );
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

router.delete("/:id", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  await Budget.deleteOne({ _id: req.params.id, userId });
  res.json({ success: true });
});

router.post("/:id/reset", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const doc = await Budget.findOne({ _id: req.params.id, userId });
  if (!doc) return res.status(404).json({ error: "Not found" });
  const now = new Date();
  doc.startDate = now;
  if (doc.period === "monthly")
    doc.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  else if (doc.period === "weekly")
    doc.endDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 7,
    );
  await doc.save();
  res.json(doc);
});

router.get("/:id/progress", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const b = await Budget.findOne({ _id: req.params.id, userId });
  if (!b) return res.status(404).json({ error: "Not found" });
  const from =
    b.startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = b.endDate || new Date();
  const spent = await Transaction.aggregate([
    {
      $match: {
        userId,
        date: { $gte: from, $lte: to },
        type: "expense",
        category: b.category,
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const spentAmount = spent[0]?.total || 0;
  res.json({ amount: b.amount, spentAmount });
});

router.put("/:id/alerts", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const { alertThresholds } = z
    .object({
      alertThresholds: z.object({ warning: z.number(), danger: z.number() }),
    })
    .parse(req.body);
  const doc = await Budget.findOneAndUpdate(
    { _id: req.params.id, userId },
    { alertThresholds },
    { new: true },
  );
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
});

export default router;
