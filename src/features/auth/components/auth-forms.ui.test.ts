import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const loginSource = readFileSync(new URL("./login-form.tsx", import.meta.url), "utf8");
const registerSource = readFileSync(new URL("./register-form.tsx", import.meta.url), "utf8");
const authCardSource = readFileSync(new URL("./auth-form-card.tsx", import.meta.url), "utf8");

describe("auth form UI", () => {
  it("uses shadcn form primitives for login and registration", () => {
    for (const source of [loginSource, registerSource]) {
      expect(source).toContain("@/components/ui/button");
      expect(source).toContain("@/components/ui/input");
      expect(source).toContain("@/components/ui/field");
    }
  });

  it("uses the shared card composition for auth pages", () => {
    expect(authCardSource).toContain("@/components/ui/card");
    expect(authCardSource).toContain("CardHeader");
    expect(authCardSource).toContain("CardContent");
  });
});
