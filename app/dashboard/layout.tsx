import DashboardShell from "./dashboard-shell";
import { IdleTimeoutGuard } from "@/components/IdleTimeoutGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <IdleTimeoutGuard>
      <DashboardShell>{children}</DashboardShell>
    </IdleTimeoutGuard>
  );
}
