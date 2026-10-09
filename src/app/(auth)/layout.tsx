import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AuthPageMotion } from "@/components/motion/auth-motion";
import styles from "@/features/auth/components/auth-experience.module.css";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthPageMotion className={styles.page}>
      <header className={styles.siteHeader} data-auth-motion="header">
        <Link href="/" className={styles.brand} aria-label="VietFlood — về trang chủ">
          <span className={styles.brandMark} aria-hidden="true"><span /></span>
          <span>VietFlood<span className={styles.brandAccent}>.</span></span>
        </Link>
        <div className={styles.headerActions}>
          <Link href="/" className={styles.homeLink}>Về trang chủ <ArrowUpRightIcon aria-hidden="true" /></Link>
          <ThemeToggle />
        </div>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.siteFooter}>
        <span>VietFlood · Cùng chủ động trước mùa nước</span>
        <span>Thông tin rõ ràng cho mỗi quyết định.</span>
      </footer>
    </AuthPageMotion>
  );
}
