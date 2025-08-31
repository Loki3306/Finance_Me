import { clerkMiddleware, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

const hasClerkEnv = Boolean(
  process.env.CLERK_SECRET_KEY &&
    (process.env.CLERK_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
);

// Export the clerk middleware - this must be applied before using getAuth
export const clerk: RequestHandler = hasClerkEnv
  ? clerkMiddleware()
  : (_req, _res, next) => next();

// This middleware should only be used after the clerk middleware has been applied
export const requireAuth: RequestHandler = (req, res, next) => {
  try {
    // Only attempt to get auth if Clerk environment variables are set
    if (hasClerkEnv) {
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
    } else {
      // If no Clerk env vars, use dev user in non-production
      if (process.env.NODE_ENV !== "production") {
        (req as any).auth = { userId: "dev_user_123" };
      } else {
        return res.status(500).json({ error: "Authentication not configured" });
      }
    }
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: "Authentication error" });
  }
};

export function getUserId(req: any) {
  return req?.auth?.userId as string;
}
