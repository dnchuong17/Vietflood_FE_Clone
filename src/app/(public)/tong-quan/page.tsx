import { AppShell } from "@/features/app-shell/components/app-shell";
import { OverviewDashboard } from "@/features/home/components/overview-dashboard";

export const metadata = {
  title: "Tổng quan | VietFlood",
};

export default function OverviewPage() {
  return (
    <AppShell title="Tổng quan" allowedRoles={["relief", "admin"]}>
      <OverviewDashboard />
    </AppShell>
  );
}
