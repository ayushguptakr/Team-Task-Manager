import { Navigate } from "react-router-dom";
import { useApp } from "@/store/AppContext";
import { AppLayout } from "./AppLayout";

export function Protected({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}
