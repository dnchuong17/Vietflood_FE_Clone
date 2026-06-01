import { AppShell } from "@/features/app-shell/components/app-shell";
import { HomeMapView } from "@/features/home/components/home-map-view";

export const metadata = {
  title: "Bản đồ Windy | VietFlood",
};

export default function MainPage() {
  return (
    <AppShell title="Bản đồ Windy">
      <div className="h-[calc(100vh-12rem)] min-h-[28rem] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <HomeMapView />
      </div>
    </AppShell>
  );
}
