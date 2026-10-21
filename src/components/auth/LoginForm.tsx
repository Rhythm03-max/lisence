"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { signInAction } from "@/lib/actions/auth";

export function LoginForm({ next, error: initialError }: { next?: string; error?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    initialError === "auth"
      ? "That sign-in or reset link is invalid or has expired. Please try again."
      : initialError ?? "",
  );
  const [show, setShow] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");

    const result = await signInAction(
      String(data.get("email") ?? "").trim(),
      String(data.get("password") ?? ""),
    );

    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? "Login failed.");
      return;
    }

    const dest = next || (result.role === "admin" || result.role === "officer" ? "/admin" : "/dashboard");
    router.push(dest);
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="login-email">User (e-mail address)</label>
        <input id="login-email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="field password-field">
        <label htmlFor="login-password">Password</label>
        <div>
          <input
            id="login-password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide password" : "Show password"}>
            ◉
          </button>
        </div>
      </div>
      <Link href="/forgot-password">Forgot Password? Request a secure email link.</Link>
      <Link href="/register">Not registered yet? Register here.</Link>
      <p className={`form-status${error ? " error" : ""}`} aria-live="polite">{error}</p>
      <div className="login-actions">
        <Link className="secondary-action" href="/">Cancel</Link>
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? "LOGGING IN…" : <>LOGIN <span aria-hidden="true">➜</span></>}
        </button>
      </div>
    </form>
  );
}
