import { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  const bypass =
    (import.meta as any).env.VITE_BYPASS_AUTH === "1" ||
    (import.meta as any).env.NEXT_PUBLIC_BYPASS_AUTH === "1";
  if (bypass) return <>{children}</>;
  if (!isLoaded) return null;
  if (!isSignedIn)
    return (
      <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
    );
  return <>{children}</>;
}
