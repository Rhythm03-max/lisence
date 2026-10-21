import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage() {
  const profile = await getCurrentProfile();
  if (profile) redirect("/dashboard");

  return (
    <main className="account-main register-main site-width" id="main-content">
      <h1>Register</h1>
      <div className="register-copy">
        <p>For security and identification purposes, we need to validate both your email address and your mobile phone number before creating your user account.</p>
        <p>Your user account will be identified by the email address which you provide below and will be required for login on the National E-Licensing System.</p>
        <p>We recommend that you register with your work email address when representing a company, or your personal email address when acting as an individual.</p>
        <p>During registration, a secure activation link will be sent to your email address for validation.</p>
      </div>
      <RegisterForm />
    </main>
  );
}
