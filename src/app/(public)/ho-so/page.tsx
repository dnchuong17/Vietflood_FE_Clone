import { AppShell } from "@/features/app-shell/components/app-shell";
import { ProfileSettings } from "@/features/profile/components/profile-settings";

export const metadata = {
  title: "Hồ sơ | VietFlood",
};

export default function ProfilePage() {
  return (
    <AppShell title="Hồ sơ và cài đặt">
      <ProfileSettings />
    </AppShell>
  );
}
