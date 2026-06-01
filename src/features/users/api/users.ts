import {
  apiDelete,
  apiGet,
  apiPath,
  apiPut,
  parseJsonResponse,
} from "@/features/auth/lib/api-client";
import type { AuthProfile } from "@/features/auth/types/auth";
import type { UserRole } from "@/features/auth/lib/roles";

export type ManagedUser = AuthProfile & {
  id?: number;
  role?: UserRole | string;
};

export type UserUpdateValues = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  province?: string;
  ward?: string;
  address_line?: string;
  role?: UserRole;
};

export async function listUsers(): Promise<ManagedUser[]> {
  const response = await apiGet(apiPath("/auth/all"), {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJsonResponse<unknown[]>(
    response,
    "Không thể tải danh sách người dùng.",
  );
  return Array.isArray(data) ? (data as ManagedUser[]) : [];
}

export async function updateUser(
  userId: number,
  values: UserUpdateValues,
): Promise<void> {
  const response = await apiPut(apiPath(`/auth/update/user/${userId}`), values, {
    credentials: "include",
  });
  await parseJsonResponse<unknown>(response, "Không thể cập nhật người dùng.");
}

export async function deleteUser(userId: number): Promise<void> {
  const response = await apiDelete(apiPath(`/auth/delete/${userId}`), {
    credentials: "include",
  });
  await parseJsonResponse<unknown>(response, "Không thể xoá người dùng.");
}
