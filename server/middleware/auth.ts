import { clerkMiddleware, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

export const clerk = clerkMiddleware();

export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    if (process.env.NODE_ENV !== "production") {
      // Dev fallback for local testing
      (req as any).auth = { userId: "dev_user" };
      return next();
    }
    return res.status(401).json({ error: "Unauthorized" });
  }
  (req as any).auth = { userId };
  next();
};

export function getUserId(req: any) {
  return req?.auth?.userId as string;
}
