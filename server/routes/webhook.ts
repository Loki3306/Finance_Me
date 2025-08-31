import { Router } from "express";
import { connectDB } from "../db";
import { User } from "../models/user";

const router = Router();

router.post("/", async (req, res) => {
  try {
    await connectDB();
    const { type, data } = req.body || {};
    if (type === "user.created" || type === "user.updated") {
      const email = data?.email_addresses?.[0]?.email_address;
      const firstName = data?.first_name;
      const lastName = data?.last_name;
      await User.findOneAndUpdate(
        { clerkId: data?.id },
        { clerkId: data?.id, email, firstName, lastName },
        { upsert: true, new: true },
      );
    }
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Webhook error" });
  }
});

export default router;
