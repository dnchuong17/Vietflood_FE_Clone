import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./profile-settings.tsx", import.meta.url),
  "utf8",
);

describe("profile settings UI", () => {
  it("uses shadcn form controls and semantic surfaces", () => {
    expect(source).toContain("@/components/ui/card");
    expect(source).toContain("@/components/ui/field");
    expect(source).toContain("@/components/ui/input");
    expect(source).toContain("@/components/ui/textarea");
    expect(source).toContain("@/features/location/api/vietnam-divisions");
    expect(source).toContain("@/features/reports/lib/address-suggestions");
    expect(source).toContain("@/features/reports/store/reports-store");
    expect(source).toContain("<Button");
    expect(source).toContain("validateChangePasswordForm");
    expect(source).toContain("confirmPassword");
    expect(source).toContain("Eye");
    expect(source).toContain("buildProfileDisplayName");
    expect(source).toContain("buildProfileLocation");
    expect(source).toContain("buildProfileAvatarUrl");
    expect(source).toContain("formatProfileDate");
    expect(source).toContain("created_at");
    expect(source).toContain("updated_at");
    expect(source).toContain("date_of_birth");
    expect(source).not.toContain("bg-white");
    expect(source).not.toContain("text-slate");
  });

  it("adds dependent profile location suggestions", () => {
    expect(source).toContain("searchProvinces(form.province)");
    expect(source).toContain("searchWards(selectedProvinceCode, form.ward)");
    expect(source).toContain("visibleProvinceOptions");
    expect(source).toContain("visibleWardOptions");
    expect(source).toContain("handleProvinceInput");
    expect(source).toContain("selectProvince");
    expect(source).toContain("selectWard");
    expect(source).toContain("disabled={!canEditWard}");
    expect(source).toContain("buildAddressSuggestions");
    expect(source).toContain("addressSuggestions");
    expect(source).toContain("updateField(\"address_line\", suggestion)");
  });
});
