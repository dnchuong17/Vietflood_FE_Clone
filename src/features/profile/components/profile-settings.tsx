"use client";

import { useEffect, useState } from "react";
import { HelpCircle, KeyRound, Save } from "lucide-react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import {
  apiPath,
  apiPut,
  apiRequest,
  parseJsonResponse,
} from "@/features/auth/lib/api-client";
import { getAccessToken } from "@/features/auth/lib/auth-storage";
import type { AuthProfile } from "@/features/auth/types/auth";

type ProfileForm = {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  province: string;
  ward: string;
  address_line: string;
};

const EMPTY_PROFILE: ProfileForm = {
  first_name: "",
  middle_name: "",
  last_name: "",
  email: "",
  phone: "",
  province: "",
  ward: "",
  address_line: "",
};

export function ProfileSettings() {
  const { showAlert } = useGlobalAlert();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(EMPTY_PROFILE);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadProfile() {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest(apiPath("/auth/profile"), {
        method: "GET",
        credentials: "include",
      });
      const data = await parseJsonResponse<AuthProfile>(
        response,
        "Could not load profile.",
      );
      setProfile(data);
      setForm({
        first_name: data.first_name ?? "",
        middle_name: data.middle_name ?? "",
        last_name: data.last_name ?? "",
        email: data.email ?? "",
        phone: data.phone ?? "",
        province: data.province ?? "",
        ward: data.ward ?? "",
        address_line: data.address_line ?? "",
      });
    } catch (error) {
      showAlert({
        title: "Profile unavailable",
        description:
          error instanceof Error ? error.message : "Could not load profile.",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateField<T extends keyof ProfileForm>(field: T, value: ProfileForm[T]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsSaving(true);
      const response = await apiPut(apiPath("/auth/update"), form, {
        credentials: "include",
      });
      await parseJsonResponse<unknown>(response, "Could not update profile.");
      showAlert({
        title: "Profile saved",
        description: "Your account details were updated.",
        variant: "success",
      });
      await loadProfile();
    } catch (error) {
      showAlert({
        title: "Update failed",
        description:
          error instanceof Error ? error.message : "Could not update profile.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await apiPut(apiPath("/auth/change-password"), passwordForm, {
        credentials: "include",
      });
      if (response.status === 404) {
        throw new Error(
          "Password change is not available until the backend endpoint is enabled.",
        );
      }
      await parseJsonResponse<unknown>(response, "Could not change password.");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      showAlert({
        title: "Password changed",
        description: "Use the new password next time you sign in.",
        variant: "success",
      });
    } catch (error) {
      showAlert({
        title: "Password not changed",
        description:
          error instanceof Error
            ? error.message
            : "Could not change password.",
        variant: "error",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_24rem]">
      <form
        onSubmit={handleSaveProfile}
        className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-bold text-slate-950">Profile</h2>
          <p className="text-sm text-slate-600">
            Role: <span className="font-semibold">{profile?.role ?? "-"}</span>
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["first_name", "First name"],
            ["middle_name", "Middle name"],
            ["last_name", "Last name"],
          ].map(([field, label]) => (
            <label
              key={field}
              className="grid gap-1 text-sm font-semibold text-slate-700"
            >
              {label}
              <input
                value={form[field as keyof ProfileForm]}
                onChange={(event) =>
                  updateField(field as keyof ProfileForm, event.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["email", "Email"],
            ["phone", "Phone"],
            ["province", "Province"],
            ["ward", "Ward"],
          ].map(([field, label]) => (
            <label
              key={field}
              className="grid gap-1 text-sm font-semibold text-slate-700"
            >
              {label}
              <input
                value={form[field as keyof ProfileForm]}
                onChange={(event) =>
                  updateField(field as keyof ProfileForm, event.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
          ))}
        </div>

        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Address
          <textarea
            value={form.address_line}
            onChange={(event) => updateField("address_line", event.target.value)}
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        <form
          onSubmit={handleChangePassword}
          className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-sky-700" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">Password</h2>
          </div>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            Current password
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: event.target.value,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-700">
            New password
            <input
              type="password"
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: event.target.value,
                }))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
              required
            />
          </label>
          <button
            type="submit"
            className="rounded-lg border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50"
          >
            Change password
          </button>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-sky-700" aria-hidden="true" />
            <h2 className="text-lg font-bold text-slate-950">Help</h2>
          </div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Citizens create reports and share live location when requesting help.</li>
            <li>Relief users triage reports, update status, monitor tracking, and review users.</li>
            <li>Admins have the same operational access plus user role and delete controls.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
