import type { Metadata } from "next";
import localFont from "next/font/local";
import { GlobalAlertProvider } from "@/components/feedback/global-alert-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VietnamDivisionsPrefetch } from "@/features/location/components/vietnam-divisions-prefetch";

import "./globals.css";

const beVietnamPro = localFont({
  src: [
    { path: "../../public/fonts/be-vietnam-pro/BeVietnamPro-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/be-vietnam-pro/BeVietnamPro-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/be-vietnam-pro/BeVietnamPro-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/be-vietnam-pro/BeVietnamPro-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/be-vietnam-pro/BeVietnamPro-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/be-vietnam-pro/BeVietnamPro-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../../public/fonts/be-vietnam-pro/BeVietnamPro-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-be-vietnam-pro",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "VietFlood",
  description: "Nền tảng giao diện web phục vụ phân tích tình hình lũ lụt tại Việt Nam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={beVietnamPro.variable} suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <VietnamDivisionsPrefetch />
          <TooltipProvider>
            <GlobalAlertProvider>{children}</GlobalAlertProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
