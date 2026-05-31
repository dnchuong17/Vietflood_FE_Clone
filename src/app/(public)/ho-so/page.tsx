import { AppShell } from "@/features/app-shell/components/app-shell";
import { ProfileSettings } from "@/features/profile/components/profile-settings";

export const metadata = {
  title: "Profile | VietFlood Insight",
};

export default function ProfilePage() {
  return (
    <AppShell title="Profile and settings">
      <ProfileSettings />
    </AppShell>
  );
}
