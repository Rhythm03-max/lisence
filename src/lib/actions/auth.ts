"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { z } from "zod";

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

// Remembers whether the pending email link is for sign-up or password recovery
// so the auth callback can route it to the right page even if the redirect URL
// is not on the Supabase allow-list (in which case Supabase falls back to the
// site root and drops the "next" hint).
const AUTH_FLOW_COOKIE = "nels_auth_flow";

async function setAuthFlow(flow: "signup" | "recovery") {
  const store = await cookies();
  store.set(AUTH_FLOW_COOKIE, flow, {
    path: "/",
    maxAge: 60 * 60,
    sameSite: "lax",
    httpOnly: true,
  });
}

const registerSchema = z.object({
  title: z.string().optional(),
  first_name: z.string().min(1, "First name is required."),
  last_name: z.string().min(1, "Last name is required."),
  gender: z.string().optional(),
  email: z.string().email("Enter a valid email address."),
  mobile: z.string().optional(),
});

export async function registerAction(input: z.infer<typeof registerSchema>): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: `${siteUrl}/auth/callback?next=/profile`,
      data: {
        title: parsed.data.title ?? "",
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        gender: parsed.data.gender ?? "",
        mobile: parsed.data.mobile ?? "",
        role: "applicant",
      },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  await setAuthFlow("signup");
  return { ok: true, message: "A secure activation link has been sent to your email address." };
}

export async function signInAction(email: string, password: string): Promise<ActionResult & { role?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return {
      ok: false,
      error: error?.message
        ? `Login failed: ${error.message}`
        : "Login failed or this account does not have access.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return { ok: false, error: "This account has been deactivated. Contact the helpdesk." };
  }

  return { ok: true, role: profile?.role ?? "applicant" };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });
  if (error) return { ok: false, error: error.message };
  await setAuthFlow("recovery");
  return { ok: true, message: "A secure password reset link has been sent to your email address." };
}

export async function updatePasswordAction(password: string): Promise<ActionResult> {
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Your password has been updated." };
}
