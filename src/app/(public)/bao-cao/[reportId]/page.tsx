import { AppShell } from "@/features/app-shell/components/app-shell";
import { ReportDetailPanel } from "@/features/reports/components/report-detail-panel";

export const metadata = {
  title: "Chi tiết báo cáo | VietFlood",
};

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;

  return (
    <AppShell title="Chi tiết báo cáo">
      <ReportDetailPanel reportId={Number(reportId)} />
    </AppShell>
  );
}
