import { WindyMap } from "@/features/map/components/windy-map";

export const metadata = {
    title: "Trang chính | VietFlood Insight",
};

export default function MainPage() {
    const apiKey = process.env.NEXT_PUBLIC_WINDY_API_KEY ?? "";

    return (
        <main className="fixed inset-0">
            <WindyMap apiKey={apiKey} />
        </main>
    );
}
