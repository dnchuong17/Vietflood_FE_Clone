import { AppShell } from "@/features/app-shell/components/app-shell";
import { UserManagement } from "@/features/users/components/user-management";

export const metadata = {
  title: "Người dùng | VietFlood",
};

export default function UsersPage() {
  return (
    <AppShell title="Người dùng" allowedRoles={["relief", "admin"]}>
      <UserManagement />
    </AppShell>
  );
}
