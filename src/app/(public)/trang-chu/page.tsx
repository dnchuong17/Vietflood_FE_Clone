import { AppShell } from "@/features/app-shell/components/app-shell";
import { HomeMapView } from "@/features/home/components/home-map-view";

export const metadata = {
  title: "Windy map | VietFlood Insight",
};

export default function MainPage() {
  return (
    <AppShell title="Windy map">
      <div className="h-[calc(100vh-12rem)] min-h-[28rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <HomeMapView />
      </div>
    </AppShell>
  );
}
