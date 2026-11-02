import { AppShell } from "@/features/app-shell/components/app-shell";
import { IncidentDashboard } from "@/features/incidents/components/incident-dashboard";

export const metadata = {
  title: "Phân công | VietFlood",
};

export default function AssignmentPage() {
  return (
    <AppShell title="Phân công vận hành" allowedRoles={["relief", "admin"]}>
      <IncidentDashboard assignments />
    </AppShell>
  );
}
