import { AppShell } from "@/features/app-shell/components/app-shell";
import { LiveTrackingPanel } from "@/features/tracking/components/live-tracking-panel";

export const metadata = {
  title: "Live tracking | VietFlood Insight",
};

export default function TrackingPage() {
  return (
    <AppShell title="Live tracking">
      <LiveTrackingPanel />
    </AppShell>
  );
}
