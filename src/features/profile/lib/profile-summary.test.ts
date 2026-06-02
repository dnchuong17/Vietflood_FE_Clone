import { describe, expect, it } from "vitest";

import type { AuthProfile } from "@/features/auth/types/auth";
import {
  buildProfileAvatarUrl,
  buildProfileDisplayName,
  buildProfileLocation,
  formatProfileDate,
} from "./profile-summary";

describe("profile summary helpers", () => {
  it("builds a mobile-like display name with username fallback", () => {
    expect(
      buildProfileDisplayName({
        first_name: "Duy",
        middle_name: "Van",
        last_name: "Nguyen",
        username: "duynguyen",
      }),
    ).toBe("Duy Van Nguyen");

    expect(buildProfileDisplayName({ username: "duynguyen" })).toBe("duynguyen");
  });

  it("builds a readable address from optional location fields", () => {
    const profile: AuthProfile = {
      address_line: "12 Tran Hung Dao",
      ward: "Ward 1",
      province: "Can Tho",
    };

    expect(buildProfileLocation(profile)).toBe("12 Tran Hung Dao, Ward 1, Can Tho");
  });

  it("formats dates and derives the same deterministic avatar endpoint as mobile", () => {
    expect(formatProfileDate("2026-06-01T10:00:00.000Z")).toBe("01/06/2026");
    expect(formatProfileDate(undefined)).toBe("Chua cap nhat");
    expect(buildProfileAvatarUrl({ username: "duy user" })).toBe(
      "https://facehash.dev/api/avatar?name=duy%20user&size=160",
    );
  });
});
