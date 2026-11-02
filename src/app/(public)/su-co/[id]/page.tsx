import { AppShell } from "@/features/app-shell/components/app-shell";
import { IncidentDetail } from "@/features/incidents/components/incident-detail";

export const metadata = { title: "Chi tiết sự cố | VietFlood" };
export default async function IncidentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell
      title="Chi tiết sự cố ngập lụt"
      allowedRoles={["admin", "relief"]}
    >
      <IncidentDetail incidentId={id} />
    </AppShell>
  );
}
