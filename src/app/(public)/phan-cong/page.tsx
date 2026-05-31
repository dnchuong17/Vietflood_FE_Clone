import { AppShell } from "@/features/app-shell/components/app-shell";
import { ReliefDashboard } from "@/features/relief/components/relief-dashboard";

export const metadata = {
  title: "Assignments | VietFlood Insight",
};

export default function AssignmentPage() {
  return (
    <AppShell title="Operational assignments" allowedRoles={["relief", "admin"]}>
      <ReliefDashboard assignmentMode />
    </AppShell>
  );
}
