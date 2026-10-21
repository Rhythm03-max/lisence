"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { registerAction } from "@/lib/actions/auth";

export function RegisterForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const mobile = `${data.get("dial") ?? ""}${data.get("mobile") ?? ""}`.trim();

    setBusy(true);
    setError("");
    setStatus("Sending your secure activation link…");

    const result = await registerAction({
      title: String(data.get("title") ?? ""),
      first_name: String(data.get("first_name") ?? ""),
      last_name: String(data.get("last_name") ?? ""),
      gender: String(data.get("gender") ?? ""),
      email,
      mobile,
    });

    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Registration could not be completed.");
      setStatus("");
      return;
    }
    setStatus(result.message ?? "Check your email.");
    router.push(`/account-activation?email=${encodeURIComponent(email)}`);
  }

  return (
    <form className="register-form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="title">Title</label>
        <select id="title" name="title" defaultValue="" required>
          <option value="">Select Title</option>
          <option>Mr</option>
          <option>Mrs</option>
          <option>Ms</option>
          <option>Dr</option>
        </select>
      </div>
      <div className="field"><label htmlFor="first-name">First Name</label><input id="first-name" name="first_name" autoComplete="given-name" required /></div>
      <div className="field"><label htmlFor="last-name">Last Name</label><input id="last-name" name="last_name" autoComplete="family-name" required /></div>
      <div className="field">
        <label htmlFor="gender">Gender</label>
        <select id="gender" name="gender" defaultValue="" required>
          <option value="">Select Gender</option>
          <option>Female</option>
          <option>Male</option>
          <option>Prefer not to say</option>
        </select>
      </div>
      <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="field">
        <label htmlFor="mobile">Mobile Number</label>
        <div className="phone-input">
          <input aria-label="Country calling code" name="dial" defaultValue="+230" />
          <input id="mobile" name="mobile" type="tel" autoComplete="tel" placeholder="111222333" required />
        </div>
      </div>
      <p className={`form-status${error ? " error" : ""}`} aria-live="polite">{error || status}</p>
      <div className="account-actions-row">
        <Link className="secondary-action" href="/">Cancel</Link>
        <button className="secondary-action register-submit" type="submit" disabled={busy}>
          {busy ? "Please wait…" : "Register"}
        </button>
      </div>
    </form>
  );
}
