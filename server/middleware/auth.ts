import { clerkMiddleware, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

const hasClerkEnv = Boolean(process.env.CLERK_SECRET_KEY && (process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY));

export const clerk: RequestHandler = hasClerkEnv
  ? clerkMiddleware()
  : (_req, _res, next) => next();

export const requireAuth: RequestHandler = (req, res, next) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    if (process.env.NODE_ENV !== "production") {
      (req as any).auth = { userId: "dev_user_123" };
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
