import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { connectDB } from "./db";
import accountsRouter from "./routes/accounts";
import transactionsRouter from "./routes/transactions";
import budgetsRouter from "./routes/budgets";
import goalsRouter from "./routes/goals";
import settingsRouter from "./routes/settings";
import { clerk } from "./middleware/auth";
import webhookRouter from "./routes/webhook";

export function createServer() {
  const app = express();

  // Middleware
  const origin = process.env.CORS_ORIGIN || "*";
  app.use(cors({ origin, credentials: true }));
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ extended: true }));
  // Webhook must be public (no auth)
  app.use("/api/webhook", webhookRouter);
  // Apply Clerk only to API routes (excluding webhook) to avoid interfering with Vite asset requests
  app.use("/api", clerk);

  // Health
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // API routes
  app.use("/api/accounts", accountsRouter);
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/goals", goalsRouter);
  app.use("/api/settings", settingsRouter);

  return app;
}
