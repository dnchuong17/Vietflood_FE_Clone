import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="grid min-h-screen place-items-center px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
