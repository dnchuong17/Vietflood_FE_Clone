import type { AuthProfile } from "@/features/auth/types/auth";

export function buildProfileDisplayName(
  profile?: Pick<AuthProfile, "first_name" | "middle_name" | "last_name" | "username"> | null,
  fallback = "Chua co du lieu",
) {
  if (!profile) {
    return fallback;
  }

  const fullName = [
    profile.first_name,
    profile.middle_name,
    profile.last_name,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return fullName || profile.username?.trim() || fallback;
}

export function buildProfileLocation(
  profile?: Pick<
    AuthProfile,
    "address_line" | "ward" | "district" | "province"
  > | null,
  fallback = "Chua cap nhat",
) {
  if (!profile) {
    return fallback;
  }

  const location = [
    profile.address_line,
    profile.ward,
    profile.district,
    profile.province,
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  return location || fallback;
}

export function formatProfileDate(value?: string | null, fallback = "Chua cap nhat") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function buildProfileAvatarUrl(
  profile?: Pick<AuthProfile, "username" | "first_name" | "middle_name" | "last_name"> | null,
) {
  const name = profile?.username?.trim() || buildProfileDisplayName(profile, "guest");
  return `https://facehash.dev/api/avatar?name=${encodeURIComponent(name)}&size=160`;
}
