import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot Password" };

export default function ForgotPasswordPage() {
  return (
    <main className="account-main login-main site-width" id="main-content">
      <h1 className="login-title">RESET YOUR PASSWORD</h1>
      <p className="register-copy">Enter the email address associated with your account and we will send you a secure link to choose a new password.</p>
      <ForgotPasswordForm />
    </main>
  );
}
