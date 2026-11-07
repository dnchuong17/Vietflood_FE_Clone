import { AppShell } from "@/features/app-shell/components/app-shell";
import { ReportReliefDashboard } from "@/features/relief/components/report-relief-dashboard";

export const metadata = {
  title: "Cứu trợ | VietFlood",
};

export default function ReliefPage() {
  return (
    <AppShell title="Điều phối cứu trợ" allowedRoles={["relief", "admin"]}>
      <ReportReliefDashboard />
    </AppShell>
  );
}
