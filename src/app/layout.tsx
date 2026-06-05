import type { Metadata } from "next";
import { Be_Vietnam_Pro, Merriweather } from "next/font/google";
import { GlobalAlertProvider } from "@/components/feedback/global-alert-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VietnamDivisionsPrefetch } from "@/features/location/components/vietnam-divisions-prefetch";

import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Segoe UI", "Arial", "Helvetica", "sans-serif"],
});

const merriweather = Merriweather({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  weight: ["700", "900"],
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
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
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${beVietnamPro.variable} ${merriweather.variable}`}
      >
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
