"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useGlobalAlert } from "@/components/feedback/global-alert-provider";
import { signIn } from "@/features/auth/api/sign-in";
import {
  getAuthIdentity,
  persistAuthTokens,
} from "@/features/auth/lib/auth-storage";
import { normalizeRole } from "@/features/auth/lib/roles";
import { getDefaultRouteForRole } from "@/features/app-shell/lib/tabs";

export function LoginForm() {
  const router = useRouter();
  const { showAlert } = useGlobalAlert();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      showAlert({
        title: "Missing information",
        description: "Enter both username and password.",
        variant: "error",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const tokens = await signIn({
        username: username.trim(),
        password,
      });

      persistAuthTokens(tokens);
      const role = normalizeRole(getAuthIdentity()?.role) ?? "citizen";

      showAlert({
        title: "Signed in",
        description: "Welcome back to VietFlood.",
        variant: "success",
      });
      router.replace(getDefaultRouteForRole(role));
      router.refresh();
    } catch (error) {
      showAlert({
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "Could not sign in. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
        Username
        <input
          name="username"
          type="text"
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
        />
      </label>

      <label className="grid gap-1.5 text-sm font-semibold text-slate-700">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          required
        />
      </label>

      <button
        type="submit"
        className="mt-1 rounded-lg bg-sky-600 px-4 py-2.5 font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Need a citizen account?{" "}
        <Link href="/dang-ky" className="font-semibold text-sky-700">
          Register
        </Link>
      </p>
    </form>
  );
}
