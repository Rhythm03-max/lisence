"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updatePasswordAction } from "@/lib/actions/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");
    const result = await updatePasswordAction(password);
    setBusy(false);

    if (!result.ok) {
      setError(result.error ?? "Could not update the password.");
      return;
    }
    setStatus(result.message ?? "Password updated.");
    setTimeout(() => router.push("/dashboard"), 900);
  }

  return (
    <form className="login-form" onSubmit={onSubmit} noValidate>
      <div className="field password-field">
        <label htmlFor="new-password">New password</label>
        <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="field password-field">
        <label htmlFor="confirm-password">Confirm password</label>
        <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <p className="field-help">Use at least 8 characters.</p>
      <p className={`form-status${error ? " error" : ""}`} aria-live="polite">{error || status}</p>
      <div className="login-actions">
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? "SAVING…" : "UPDATE PASSWORD"}
        </button>
      </div>
    </form>
  );
}
