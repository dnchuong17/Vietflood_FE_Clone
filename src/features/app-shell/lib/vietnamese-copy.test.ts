import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const CHECKS = [
  {
    file: "src/features/app-shell/lib/tabs.ts",
    literals: ["Reports", "Tracking", "Profile", "Relief", "Users"],
  },
  {
    file: "src/components/navigation/site-header.tsx",
    literals: ["Sign in", "Sign out", "Signed out", "Primary navigation"],
  },
  {
    file: "src/features/app-shell/components/app-shell.tsx",
    literals: ["Checking access"],
  },
  {
    file: "src/features/auth/components/login-form.tsx",
    literals: ["Missing information", "Username", "Password", "Signing in"],
  },
  {
    file: "src/features/profile/components/profile-settings.tsx",
    literals: [
      "Profile unavailable",
      "Loading profile",
      "Change password",
      "backend",
      "endpoint",
    ],
  },
  {
    file: "src/features/tracking/components/live-tracking-panel.tsx",
    literals: [
      "Share location",
      "Live monitor",
      "No active locations",
      "polling + websocket",
      "qua socket",
      "backend",
    ],
  },
  {
    file: "src/app/(public)/huong-dan/page.tsx",
    literals: ["User guide"],
  },
  {
    file: "src/features/help/components/user-guide.tsx",
    literals: ["Mobile parity guide", "guide areas", "mobile"],
  },
  {
    file: "src/app/page.tsx",
    literals: ["VietFlood Insight", "mobile", "qua socket", "backend"],
  },
  {
    file: "src/app/layout.tsx",
    literals: ["frontend"],
  },
  {
    file: "src/features/map/components/windy-map.tsx",
    literals: ["Windy interactive map"],
  },
  {
    file: "src/features/reports/components/report-workspace.tsx",
    literals: ["ID, vị trí"],
  },
  {
    file: "src/features/home/components/tools.tsx",
    literals: ["lớp overlay", "overlay bản đồ"],
  },
  {
    file: "src/features/users/components/user-management.tsx",
    literals: [
      ">ID<",
      ">RBAC<",
      "backend",
      "[\"email\", \"Email\"]",
      "email, số điện thoại",
    ],
  },
  {
    file: "src/features/help/lib/guide-content.ts",
    literals: ["backend", "endpoint", "RBAC"],
  },
  {
    file: "src/features/profile/components/profile-settings.tsx",
    literals: ["Open full guide"],
  },
  {
    file: "src/features/reports/api/reports.ts",
    literals: ["Could not load reports", "Missing report ID"],
  },
  {
    file: "src/features/users/api/users.ts",
    literals: ["Could not load users"],
  },
] as const;

describe("Vietnamese UI copy", () => {
  it("does not keep known English UI strings in internal web surfaces", () => {
    const offenders = CHECKS.flatMap(({ file, literals }) => {
      const source = readFileSync(join(process.cwd(), file), "utf8");

      return literals
        .filter((literal) => source.includes(literal))
        .map((literal) => `${file}: ${literal}`);
    });

    expect(offenders).toEqual([]);
  });
});
