import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../db";
import { Transaction } from "../models/transaction";
import { Account } from "../models/account";
import { getUserId, requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const txSchema = z.object({
  amount: z.number(),
  type: z.enum(["income", "expense", "transfer"]),
  accountId: z.string(),
  transferAccountId: z.string().optional(),
  category: z.string(),
  subCategory: z.string().optional(),
  description: z.string().optional(),
  date: z.coerce.date(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
});

router.get("/", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const { account, category, q, page = 1, limit = 50, from, to } = req.query as any;
  const filter: any = { userId, isDeleted: false };
  if (account) filter.accountId = account;
  if (category) filter.category = category;
  if (from || to) filter.date = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(to) } : {}) };
  if (q) filter.$text = { $search: q };
  const docs = await Transaction.find(filter)
    .sort({ date: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  res.json(docs);
});

router.get("/recent", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const docs = await Transaction.find({ userId, isDeleted: false }).sort({ date: -1 }).limit(20);
  res.json(docs);
});

router.post("/", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = txSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const body = parsed.data;

  // Create transaction(s)
  let docs: any[] = [];
  if (body.type === "transfer") {
    if (!body.transferAccountId) return res.status(400).json({ error: "transferAccountId required" });
    // expense from source
    docs.push(
      await Transaction.create({ ...body, userId, type: "expense", transferAccountId: body.transferAccountId }),
    );
    // income to destination
    docs.push(
      await Transaction.create({ ...body, userId, accountId: body.transferAccountId, type: "income", transferAccountId: body.accountId }),
    );
  } else {
    docs.push(await Transaction.create({ ...body, userId }));
  }

  // Recalculate balances
  await recalcBalances(userId, [body.accountId, body.transferAccountId].filter(Boolean) as string[]);

  res.status(201).json(Array.isArray(docs) ? docs : [docs]);
});

router.put("/:id", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = txSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await Transaction.findOneAndUpdate({ _id: req.params.id, userId }, parsed.data, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  if (parsed.data.accountId) await recalcBalances(userId, [parsed.data.accountId]);
  res.json(doc);
});

router.delete("/:id", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const doc = await Transaction.findOneAndUpdate({ _id: req.params.id, userId }, { isDeleted: true }, { new: true });
  if (!doc) return res.status(404).json({ error: "Not found" });
  await recalcBalances(userId, [String(doc.accountId)]);
  res.json({ success: true });
});

router.post("/bulk", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const items = z.array(txSchema).parse(req.body);
  const docs = await Transaction.insertMany(items.map((i) => ({ ...i, userId })));
  const accIds = [...new Set(items.map((i) => i.accountId))];
  await recalcBalances(userId, accIds);
  res.status(201).json(docs);
});

router.get("/summary/:period", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const period = req.params.period; // daily, weekly, monthly
  const now = new Date();
  const start = new Date(now);
  if (period === "monthly") start.setDate(1);
  else if (period === "weekly") start.setDate(now.getDate() - 7);
  else start.setHours(0, 0, 0, 0);
  const summary = await Transaction.aggregate([
    { $match: { userId, date: { $gte: start }, isDeleted: false } },
    { $group: { _id: "$category", total: { $sum: "$amount" } } },
    { $sort: { total: -1 } },
  ]);
  res.json(summary);
});

router.get("/search", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const { q } = req.query as any;
  const docs = await Transaction.find({ userId, $or: [
    { description: { $regex: q || "", $options: "i" } },
    { category: { $regex: q || "", $options: "i" } },
    { notes: { $regex: q || "", $options: "i" } },
  ], isDeleted: false }).limit(100);
  res.json(docs);
});

async function recalcBalances(userId: string, accountIds: string[]) {
  const ids = [...new Set(accountIds)];
  for (const id of ids) {
    const txs = await Transaction.find({ userId, accountId: id, isDeleted: false });
    const income = txs.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const expense = txs.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    await Account.findByIdAndUpdate(id, { balance: income - expense });
  }
}

export default router;
