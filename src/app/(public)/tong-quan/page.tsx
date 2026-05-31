import { AppShell } from "@/features/app-shell/components/app-shell";
import { OverviewDashboard } from "@/features/home/components/overview-dashboard";

export const metadata = {
  title: "Overview | VietFlood Insight",
};

export default function OverviewPage() {
  return (
    <AppShell title="Overview" allowedRoles={["relief", "admin"]}>
      <OverviewDashboard />
    </AppShell>
  );
}
