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

// Apply requireAuth to all routes
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const { type, bank } = req.query as { type?: string; bank?: string };
    const filter: any = { userId, deletedAt: null };
    if (type) filter.type = type;
    if (bank) filter.subType = bank;
    const accounts = await Account.find(filter).sort({ createdAt: -1 });
    res.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const parsed = accountSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });
    const body = parsed.data;
    if (body.type === "upi" && !body.upiId)
      return res.status(400).json({ error: "upiId required for UPI accounts" });
    if (body.type === "credit_card" && body.creditLimit == null)
      return res
        .status(400)
        .json({ error: "creditLimit required for credit cards" });
    const acc = await Account.create({ ...body, userId });
    res.status(201).json(acc);
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const parsed = accountSchema.partial().safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });
    const acc = await Account.findOneAndUpdate(
      { _id: req.params.id, userId },
      parsed.data,
      { new: true },
    );
    if (!acc) return res.status(404).json({ error: "Not found" });
    res.json(acc);
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const acc = await Account.findOneAndUpdate(
      { _id: req.params.id, userId },
      { deletedAt: new Date(), isActive: false },
      { new: true },
    );
    if (!acc) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.put("/:id/balance", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const { amount } = z.object({ amount: z.number() }).parse(req.body);
    const acc = await Account.findOneAndUpdate(
      { _id: req.params.id, userId },
      { balance: amount },
      { new: true },
    );
    if (!acc) return res.status(404).json({ error: "Not found" });
    res.json(acc);
  } catch (error) {
    console.error("Error updating account balance:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

router.get("/:id/transactions", async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const tx = await Transaction.find({
      userId,
      accountId: req.params.id,
      isDeleted: false,
    })
      .sort({ date: -1 })
      .limit(200);
    res.json(tx);
  } catch (error) {
    console.error("Error fetching account transactions:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

export default router;
