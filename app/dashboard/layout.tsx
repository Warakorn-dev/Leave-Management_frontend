import DashboardShell from "./dashboard-shell";
import { IdleTimeoutGuard } from "@/components/IdleTimeoutGuard";
import { AuthProvider } from "@/context/AuthContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <IdleTimeoutGuard>
        <DashboardShell>{children}</DashboardShell>
      </IdleTimeoutGuard>
    </AuthProvider>
  );
}
