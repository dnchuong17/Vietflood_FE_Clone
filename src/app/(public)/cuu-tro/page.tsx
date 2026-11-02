import { AppShell } from "@/features/app-shell/components/app-shell";
import { IncidentDashboard } from "@/features/incidents/components/incident-dashboard";

export const metadata = {
  title: "Cứu trợ | VietFlood",
};

export default function ReliefPage() {
  return (
    <AppShell title="Điều phối cứu trợ" allowedRoles={["relief", "admin"]}>
      <IncidentDashboard />
    </AppShell>
  );
}
