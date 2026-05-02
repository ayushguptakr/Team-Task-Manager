import { Navigate } from "react-router-dom";
import { useApp } from "@/store/AppContext";
import { AppLayout } from "./AppLayout";

export function Protected({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useApp();
  if (loading.auth) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Loading...</div>;
  if (!currentUser) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}
