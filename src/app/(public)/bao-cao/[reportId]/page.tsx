import { AppShell } from "@/features/app-shell/components/app-shell";
import { ReportDetail } from "@/features/reports/components/report-detail";

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
      <ReportDetail reportId={reportId} />
    </AppShell>
  );
}
