import type { Metadata } from "next";
import { GlobalAlertProvider } from "@/components/feedback/global-alert-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { VietnamDivisionsPrefetch } from "@/features/location/components/vietnam-divisions-prefetch";

import "./globals.css";

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
