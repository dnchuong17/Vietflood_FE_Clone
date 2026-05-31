import type { UserRole } from "@/features/auth/lib/roles";

export type SignInPayload = {
  username: string;
  password: string;
};

export type SignInResponse = {
  accessToken: string;
  refresh_token?: string;
};

export type AuthProfile = {
  id?: number;
  username?: string;
  email?: string;
  phone?: string;
  role?: UserRole | string;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  province?: string;
  ward?: string;
  address_line?: string;
  created_at?: string;
};

export type RegisterPayload = {
  username: string;
  password: string;
  email: string;
  phone: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  province?: string;
  ward?: string;
  address_line?: string;
  role?: UserRole;
};
