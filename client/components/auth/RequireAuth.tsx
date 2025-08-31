import { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  if (!isLoaded) return null;
  if (!isSignedIn) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  return <>{children}</>;
}
