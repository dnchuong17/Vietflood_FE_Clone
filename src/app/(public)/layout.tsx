import type { ReactNode } from "react";

import { SiteHeader } from "@/components/navigation/site-header";

type PublicLayoutProps = {
    children: ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
    return (
        <div className="relative h-dvh overflow-hidden">
            <a href="#main-content" className="skip-link">Chuyển đến nội dung chính</a>
            <div className="absolute inset-x-0 top-0 z-40">
                <SiteHeader />
            </div>
            <div className="h-full overflow-y-auto" data-motion-scroller>{children}</div>
        </div>
    );
}
