import { AppShell } from "@/features/app-shell/components/app-shell";
import { UserGuide } from "@/features/help/components/user-guide";

export const metadata = {
  title: "Hướng dẫn sử dụng | VietFlood",
};

export default function UserGuidePage() {
  return (
    <AppShell
      allowedRoles={["citizen", "relief", "admin"]}
      title="Hướng dẫn sử dụng"
    >
      <UserGuide />
    </AppShell>
  );
}
