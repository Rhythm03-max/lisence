import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Set New Password" };

export default async function ResetPasswordPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <main className="account-main login-main site-width" id="main-content">
        <h1 className="login-title">RESET LINK EXPIRED</h1>
        <p className="register-copy">
          This password reset link is invalid or has already been used. Request a new
          link to choose a new password.
        </p>
        <div className="login-actions">
          <Link className="secondary-action" href="/login">Back to login</Link>
          <Link className="primary-action" href="/forgot-password">Request a new link</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="account-main login-main site-width" id="main-content">
      <h1 className="login-title">CHOOSE A NEW PASSWORD</h1>
      <ResetPasswordForm />
    </main>
  );
}
