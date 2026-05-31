import { AppShell } from "@/features/app-shell/components/app-shell";
import { ReliefDashboard } from "@/features/relief/components/relief-dashboard";

export const metadata = {
  title: "Relief | VietFlood Insight",
};

export default function ReliefPage() {
  return (
    <AppShell title="Relief operations" allowedRoles={["relief", "admin"]}>
      <ReliefDashboard />
    </AppShell>
  );
}
