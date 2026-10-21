"use client";

import { useState, type FormEvent } from "react";
import { updateProfileAction } from "@/lib/actions/applicant";
import { updatePasswordAction } from "@/lib/actions/auth";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [passBusy, setPassBusy] = useState(false);
  const [passStatus, setPassStatus] = useState("");
  const [passError, setPassError] = useState("");

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    const result = await updateProfileAction(new FormData(event.currentTarget));
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save changes.");
      return;
    }
    setStatus(result.message ?? "Saved.");
  }

  async function onPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    setPassError("");
    setPassStatus("");
    if (password !== confirm) {
      setPassError("Passwords do not match.");
      return;
    }
    setPassBusy(true);
    const result = await updatePasswordAction(password);
    setPassBusy(false);
    if (!result.ok) {
      setPassError(result.error ?? "Could not set the password.");
      return;
    }
    setPassStatus(result.message ?? "Password set.");
    event.currentTarget.reset();
  }

  return (
    <>
      <section className="panel-card">
        <header><h2>Personal details</h2></header>
        <div className="panel-body">
          <form className="profile-form" onSubmit={onSave} noValidate>
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="title">Title</label>
                <select id="title" name="title" defaultValue={profile.title ?? ""}>
                  <option value="">Select Title</option>
                  <option>Mr</option><option>Mrs</option><option>Ms</option><option>Dr</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" defaultValue={profile.gender ?? ""}>
                  <option value="">Select Gender</option>
                  <option>Female</option><option>Male</option><option>Prefer not to say</option>
                </select>
              </div>
              <div className="field"><label htmlFor="first_name">First name</label><input id="first_name" name="first_name" defaultValue={profile.first_name ?? ""} required /></div>
              <div className="field"><label htmlFor="last_name">Last name</label><input id="last_name" name="last_name" defaultValue={profile.last_name ?? ""} required /></div>
              <div className="field"><label htmlFor="email">Email</label><input id="email" defaultValue={profile.email ?? ""} disabled /></div>
              <div className="field"><label htmlFor="mobile">Mobile number</label><input id="mobile" name="mobile" defaultValue={profile.mobile ?? ""} /></div>
              <div className="field"><label htmlFor="nationality">Nationality</label><input id="nationality" name="nationality" defaultValue={profile.nationality ?? ""} /></div>
              <div className="field"><label htmlFor="passport_number">Passport number</label><input id="passport_number" name="passport_number" defaultValue={profile.passport_number ?? ""} /></div>
              <div className="field"><label htmlFor="date_of_birth">Date of birth</label><input id="date_of_birth" name="date_of_birth" type="date" defaultValue={profile.date_of_birth ?? ""} /></div>
              <div className="field"><label htmlFor="address">Address</label><input id="address" name="address" defaultValue={profile.address ?? ""} /></div>
            </div>
            <p className={`form-status${error ? " error" : status ? " success" : ""}`} aria-live="polite">{error || status}</p>
            <button className="primary-action" type="submit" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
          </form>
        </div>
      </section>

      <section className="panel-card">
        <header><h2>Password</h2></header>
        <div className="panel-body">
          <form className="profile-form" onSubmit={onPassword} noValidate>
            <div className="form-grid-2">
              <div className="field"><label htmlFor="password">New password</label><input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required /></div>
              <div className="field"><label htmlFor="confirm">Confirm password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required /></div>
            </div>
            <p className="field-help">Use at least 8 characters. Set a password to log in without waiting for an email link.</p>
            <p className={`form-status${passError ? " error" : passStatus ? " success" : ""}`} aria-live="polite">{passError || passStatus}</p>
            <button className="secondary-action" type="submit" disabled={passBusy}>{passBusy ? "Saving…" : "Set password"}</button>
          </form>
        </div>
      </section>
    </>
  );
}
