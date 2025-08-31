import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../db";
import { Account } from "../models/account";
import { Transaction } from "../models/transaction";
import { getUserId, requireAuth } from "../middleware/auth";

const router = Router();

const accountSchema = z.object({
  name: z.string().min(2),
  type: z.enum(["cash", "upi", "credit_card", "bank"]),
  subType: z.string().optional(),
  balance: z.number(),
  creditLimit: z.number().optional(),
  upiId: z.string().optional(),
  paymentDueDate: z.number().min(1).max(31).optional(),
});

router.use(requireAuth);

router.get("/", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const { type, bank } = req.query as { type?: string; bank?: string };
  const filter: any = { userId, deletedAt: null };
  if (type) filter.type = type;
  if (bank) filter.subType = bank;
  const accounts = await Account.find(filter).sort({ createdAt: -1 });
  res.json(accounts);
});

router.post("/", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = accountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const body = parsed.data;
  if (body.type === "upi" && !body.upiId) return res.status(400).json({ error: "upiId required for UPI accounts" });
  if (body.type === "credit_card" && body.creditLimit == null) return res.status(400).json({ error: "creditLimit required for credit cards" });
  const acc = await Account.create({ ...body, userId });
  res.status(201).json(acc);
});

router.put("/:id", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const parsed = accountSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const acc = await Account.findOneAndUpdate({ _id: req.params.id, userId }, parsed.data, { new: true });
  if (!acc) return res.status(404).json({ error: "Not found" });
  res.json(acc);
});

router.delete("/:id", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const acc = await Account.findOneAndUpdate({ _id: req.params.id, userId }, { deletedAt: new Date(), isActive: false }, { new: true });
  if (!acc) return res.status(404).json({ error: "Not found" });
  res.json({ success: true });
});

router.put("/:id/balance", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const { amount } = z.object({ amount: z.number() }).parse(req.body);
  const acc = await Account.findOneAndUpdate({ _id: req.params.id, userId }, { balance: amount }, { new: true });
  if (!acc) return res.status(404).json({ error: "Not found" });
  res.json(acc);
});

router.get("/:id/transactions", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const tx = await Transaction.find({ userId, accountId: req.params.id, isDeleted: false }).sort({ date: -1 }).limit(200);
  res.json(tx);
});

export default router;
