import { AppShell } from "@/features/app-shell/components/app-shell";
import { ReliefDashboard } from "@/features/relief/components/relief-dashboard";

export const metadata = {
  title: "Phân công | VietFlood",
};

export default function AssignmentPage() {
  return (
    <AppShell title="Phân công vận hành" allowedRoles={["relief", "admin"]}>
      <ReliefDashboard assignmentMode />
    </AppShell>
  );
}
