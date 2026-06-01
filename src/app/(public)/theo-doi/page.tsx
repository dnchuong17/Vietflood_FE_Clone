import { AppShell } from "@/features/app-shell/components/app-shell";
import { LiveTrackingPanel } from "@/features/tracking/components/live-tracking-panel";

export const metadata = {
  title: "Theo dõi trực tiếp | VietFlood",
};

export default function TrackingPage() {
  return (
    <AppShell title="Theo dõi trực tiếp">
      <LiveTrackingPanel />
    </AppShell>
  );
}
