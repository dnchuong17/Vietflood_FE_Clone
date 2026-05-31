import { AppShell } from "@/features/app-shell/components/app-shell";
import { UserManagement } from "@/features/users/components/user-management";

export const metadata = {
  title: "Users | VietFlood Insight",
};

export default function UsersPage() {
  return (
    <AppShell title="Users" allowedRoles={["relief", "admin"]}>
      <UserManagement />
    </AppShell>
  );
}
