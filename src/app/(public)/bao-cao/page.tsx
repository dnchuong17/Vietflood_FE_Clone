import { AppShell } from "@/features/app-shell/components/app-shell";
import { ReportWorkspace } from "@/features/reports/components/report-workspace";

export const metadata = {
  title: "Reports | VietFlood Insight",
};

export default function ReportsPage() {
  return (
    <AppShell title="Reports">
      <ReportWorkspace />
    </AppShell>
  );
}
