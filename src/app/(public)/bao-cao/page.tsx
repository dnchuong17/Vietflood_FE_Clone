import { AppShell } from "@/features/app-shell/components/app-shell";
import { ReportWorkspace } from "@/features/reports/components/report-workspace";

export const metadata = {
  title: "Báo cáo | VietFlood",
};

export default function ReportsPage() {
  return (
    <AppShell title="Báo cáo">
      <ReportWorkspace />
    </AppShell>
  );
}
