"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { register } from "@/features/auth/api/sign-in";

const INITIAL_FORM = {
  username: "",
  password: "",
  email: "",
  phone: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  province: "",
  ward: "",
  address_line: "",
};

export function RegisterForm() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      await register({
        ...form,
        role: "citizen",
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        first_name: form.first_name.trim(),
        middle_name: form.middle_name.trim(),
        last_name: form.last_name.trim(),
        province: form.province.trim(),
        ward: form.ward.trim(),
        address_line: form.address_line.trim(),
      });

      showAlert({
        title: "Account created",
        description: "You can now sign in with your citizen account.",
        variant: "success",
      });
      router.replace("/dang-nhap");
    } catch (error) {
      showAlert({
        title: "Registration failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not create account. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          First name
          <input
            value={form.first_name}
            onChange={(event) => updateField("first_name", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Last name
          <input
            value={form.last_name}
            onChange={(event) => updateField("last_name", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
        Username
        <input
          value={form.username}
          onChange={(event) => updateField("username", event.target.value)}
          autoComplete="username"
          className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
        />
      </label>

      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
        Password
        <input
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          type="password"
          autoComplete="new-password"
          minLength={6}
          className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Email
          <input
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            type="email"
            autoComplete="email"
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Phone
          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            autoComplete="tel"
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
            required
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
        Address
        <input
          value={form.address_line}
          onChange={(event) => updateField("address_line", event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Province
          <input
            value={form.province}
            onChange={(event) => updateField("province", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
          Ward
          <input
            value={form.ward}
            onChange={(event) => updateField("ward", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 rounded-lg bg-sky-600 px-4 py-2.5 font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Creating account..." : "Create citizen account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/dang-nhap" className="font-semibold text-sky-700">
          Sign in
        </Link>
      </p>
    </form>
  );
}
