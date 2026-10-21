"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { requestPasswordResetAction } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setStatus("");

    const result = await requestPasswordResetAction(String(data.get("email") ?? "").trim());
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send the reset link.");
      return;
    }
    setStatus(result.message ?? "Check your email for the reset link.");
  }

  return (
    <form className="login-form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="reset-email">User (e-mail address)</label>
        <input id="reset-email" name="email" type="email" autoComplete="email" required />
      </div>
      <p className={`form-status${error ? " error" : ""}`} aria-live="polite">{error || status}</p>
      <div className="login-actions">
        <Link className="secondary-action" href="/login">Back to login</Link>
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? "SENDING…" : "SEND LINK"}
        </button>
      </div>
    </form>
  );
}
