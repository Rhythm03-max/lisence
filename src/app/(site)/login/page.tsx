import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentProfile } from "@/lib/auth";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile) redirect(profile.role === "admin" || profile.role === "officer" ? "/admin" : "/dashboard");

  const { next, error } = await searchParams;

  return (
    <main className="account-main login-main site-width" id="main-content">
      <h1 className="login-title">LOGIN AS...</h1>
      <LoginForm next={next} error={error} />
    </main>
  );
}
