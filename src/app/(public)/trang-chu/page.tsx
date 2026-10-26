import { AppShell } from "@/features/app-shell/components/app-shell";
import { HomeMapView } from "@/features/home/components/home-map-view";

export const metadata = {
  title: "Bản đồ Windy | VietFlood",
};

export default function MainPage() {
  return (
    <AppShell title="Bản đồ Windy">
      <HomeMapView />
    </AppShell>
  );
}
