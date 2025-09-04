import { Router } from "express";
import { z } from "zod";
import { connectDB } from "../db";
import { Transaction } from "../models/transaction";
import { Account } from "../models/account";
import { getUserId, requireAuth } from "../middleware/auth";
import { updateBudgetsForTransaction } from "./budgets";

const router = Router();
// Temporarily remove auth requirement for testing budget updates
// router.use(requireAuth);

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
  
  // For debugging - use a default userId if none provided
  let userId = "debug_user_123"; // Default for testing
  
  try {
    const authUserId = getUserId(req);
    if (authUserId) {
      userId = authUserId;
      console.log("Found authenticated userId for GET:", userId);
    }
  } catch (error) {
    console.log("No auth found for GET transactions, using default userId:", userId);
  }
  
  const {
    account,
    accounts,
    q,
    search,
    page = 1,
    limit = 50,
    from,
    to,
    startDate,
    endDate,
    type,
    sort,
  } = req.query as any;
  const filter: any = { userId, isDeleted: false };
  const accList = (accounts || account || "")
    .toString()
    .split(",")
    .filter(Boolean);
  if (accList.length) filter.accountId = { $in: accList };
  if (type) filter.type = type;
  const fromVal = from || startDate;
  const toVal = to || endDate;
  if (fromVal || toVal)
    filter.date = {
      ...(fromVal ? { $gte: new Date(fromVal) } : {}),
      ...(toVal ? { $lte: new Date(toVal) } : {}),
    };
  const searchQ = search || q;
  if (searchQ)
    filter.$or = [
      { description: { $regex: searchQ, $options: "i" } },
      { category: { $regex: searchQ, $options: "i" } },
    ];
  const sortMap: Record<string, any> = {
    date_desc: { createdAt: -1 }, // Sort by creation time, not transaction date
    date_asc: { createdAt: 1 },
    amount_desc: { amount: -1 },
    amount_asc: { amount: 1 },
  };
  const sortBy = sortMap[sort as string] || { createdAt: -1 };
  const docs = await Transaction.find(filter)
    .sort(sortBy)
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));
  res.json(docs);
});

router.get("/recent", async (req, res) => {
  await connectDB();
  
  // For debugging - use a default userId if none provided
  let userId = "debug_user_123"; // Default for testing
  
  try {
    const authUserId = getUserId(req);
    if (authUserId) {
      userId = authUserId;
      console.log("Found authenticated userId for GET recent:", userId);
    }
  } catch (error) {
    console.log("No auth found for GET recent transactions, using default userId:", userId);
  }
  
  const docs = await Transaction.find({ userId, isDeleted: false })
    .sort({ createdAt: -1 }) // Sort by creation time, not transaction date
    .limit(20);
  res.json(docs);
});

router.post("/", async (req, res) => {
  await connectDB();
  
  // For debugging - use a default userId if none provided
  let userId = "debug_user_123"; // Default for testing
  
  try {
    const authUserId = getUserId(req);
    if (authUserId) {
      userId = authUserId;
      console.log("Found authenticated userId:", userId);
    }
  } catch (error) {
    console.log("No auth found for POST transaction, using default userId:", userId);
  }
  
  const parsed = txSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const body = parsed.data;

  // Create transaction(s)
  let docs: any[] = [];
  console.log("=== TRANSACTION CREATION START ===");
  console.log("Transaction data:", body);
  console.log("UserId:", userId);
  
  if (body.type === "transfer") {
    if (!body.transferAccountId)
      return res.status(400).json({ error: "transferAccountId required" });
    // expense from source
    docs.push(
      await Transaction.create({
        ...body,
        userId,
        type: "expense",
        transferAccountId: body.transferAccountId,
      }),
    );
    // income to destination
    docs.push(
      await Transaction.create({
        ...body,
        userId,
        accountId: body.transferAccountId,
        type: "income",
        transferAccountId: body.accountId,
      }),
    );
  } else {
    docs.push(await Transaction.create({ ...body, userId }));
  }
  
  console.log("Created transactions:", docs.length);
  docs.forEach((doc, index) => {
    console.log(`Transaction ${index + 1}:`, {
      id: doc._id,
      type: doc.type,
      amount: doc.amount,
      category: doc.category,
      accountId: doc.accountId
    });
  });

  // Recalculate balances
  await recalcBalances(
    userId,
    [body.accountId, body.transferAccountId].filter(Boolean) as string[],
  );

  // Update affected budgets for each created transaction
  for (const doc of docs) {
    await updateBudgetsForTransaction(userId, doc, 'create');
  }

  res.status(201).json(Array.isArray(docs) ? docs : [docs]);
});

router.put("/:id", async (req, res) => {
  await connectDB();
  
  // For debugging - use a default userId if none provided
  let userId = "debug_user_123"; // Default for testing
  
  try {
    const authUserId = getUserId(req);
    if (authUserId) {
      userId = authUserId;
      console.log("Found authenticated userId for PUT:", userId);
    }
  } catch (error) {
    console.log("No auth found for PUT transaction, using default userId:", userId);
  }
  
  const parsed = txSchema.partial().safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const doc = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId },
    parsed.data,
    { new: true },
  );
  if (!doc) return res.status(404).json({ error: "Not found" });
  if (parsed.data.accountId)
    await recalcBalances(userId, [parsed.data.accountId]);
  
  // Update affected budgets after transaction update
  await updateBudgetsForTransaction(userId, doc, 'update');
  
  res.json(doc);
});

router.delete("/:id", async (req, res) => {
  await connectDB();
  
  // For debugging - use a default userId if none provided
  let userId = "debug_user_123"; // Default for testing
  
  try {
    const authUserId = getUserId(req);
    if (authUserId) {
      userId = authUserId;
      console.log("Found authenticated userId for DELETE:", userId);
    }
  } catch (error) {
    console.log("No auth found for DELETE transaction, using default userId:", userId);
  }
  
  const doc = await Transaction.findOneAndUpdate(
    { _id: req.params.id, userId },
    { isDeleted: true },
    { new: true },
  );
  if (!doc) return res.status(404).json({ error: "Not found" });
  await recalcBalances(userId, [String(doc.accountId)]);
  
  // Update affected budgets after transaction deletion
  await updateBudgetsForTransaction(userId, doc, 'delete');
  
  res.json({ success: true });
});

router.delete("/bulk", async (req, res) => {
  await connectDB();
  
  // For debugging - use a default userId if none provided
  let userId = "debug_user_123"; // Default for testing
  
  try {
    const authUserId = getUserId(req);
    if (authUserId) {
      userId = authUserId;
      console.log("Found authenticated userId for bulk DELETE:", userId);
    }
  } catch (error) {
    console.log("No auth found for bulk DELETE transaction, using default userId:", userId);
  }
  
  const ids = (req.body?.ids || []) as string[];
  if (!Array.isArray(ids) || !ids.length)
    return res.status(400).json({ error: "ids required" });
  await Transaction.updateMany(
    { _id: { $in: ids }, userId },
    { $set: { isDeleted: true } },
  );
  res.json({ success: true });
});

router.get("/export", async (req, res) => {
  await connectDB();
  
  // For debugging - use a default userId if none provided
  let userId = "debug_user_123"; // Default for testing
  
  try {
    const authUserId = getUserId(req);
    if (authUserId) {
      userId = authUserId;
      console.log("Found authenticated userId for export:", userId);
    }
  } catch (error) {
    console.log("No auth found for export transactions, using default userId:", userId);
  }
  
  const { from, to } = req.query as any;
  const filter: any = { userId, isDeleted: false };
  if (from || to)
    filter.date = {
      ...(from ? { $gte: new Date(from) } : {}),
      ...(to ? { $lte: new Date(to) } : {}),
    };
  const docs = await Transaction.find(filter).sort({ date: -1 });
  const rows = ["date,type,category,amount,accountId,description"]
    .concat(
      docs.map(
        (d) =>
          `${d.date.toISOString()},${d.type},${(d.category || "").replace(/,/g, " ")},${d.amount},${d.accountId},${(d.description || "").replace(/,/g, " ")}`,
      ),
    )
    .join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=transactions.csv`);
  res.send(rows);
});

router.post("/bulk", async (req, res) => {
  await connectDB();
  const userId = getUserId(req);
  const items = z.array(txSchema).parse(req.body);
  const docs = await Transaction.insertMany(
    items.map((i) => ({ ...i, userId })),
  );
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
  const docs = await Transaction.find({
    userId,
    $or: [
      { description: { $regex: q || "", $options: "i" } },
      { category: { $regex: q || "", $options: "i" } },
      { notes: { $regex: q || "", $options: "i" } },
    ],
    isDeleted: false,
  }).limit(100);
  res.json(docs);
});

async function recalcBalances(userId: string, accountIds: string[]) {
  const ids = [...new Set(accountIds)];
  for (const id of ids) {
    // Get the account to access the initial balance
    const account = await Account.findById(id);
    if (!account) {
      console.warn(`Account ${id} not found during balance recalculation`);
      continue;
    }

    const txs = await Transaction.find({
      userId,
      accountId: id,
      isDeleted: false,
    });
    
    const income = txs
      .filter((t) => t.type === "income")
      .reduce((a, b) => a + b.amount, 0);
    const expense = txs
      .filter((t) => t.type === "expense")
      .reduce((a, b) => a + b.amount, 0);
    
    // Calculate balance: initial balance + income - expense
    const newBalance = (account.initialBalance || 0) + income - expense;
    
    console.log(`Recalculating balance for account ${id}:`, {
      initialBalance: account.initialBalance || 0,
      income,
      expense,
      newBalance
    });
    
    await Account.findByIdAndUpdate(id, { balance: newBalance });
  }
}

export default router;
