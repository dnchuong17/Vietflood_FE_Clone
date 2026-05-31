"use client";

import { useState } from "react";

import { ReportsOverview } from "@/features/reports/components/reports-overview";
import { UsersOverview } from "./users-overview";

type OverviewTab = "users" | "reports";

export function OverviewDashboard() {
  const [activeTab, setActiveTab] = useState<OverviewTab>("users");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {[
          ["users", "Users"],
          ["reports", "Reports"],
        ].map(([value, label]) => {
          const isActive = activeTab === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as OverviewTab)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-sky-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === "users" ? <UsersOverview /> : <ReportsOverview />}
    </div>
  );
}
