import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (data as Profile) ?? null;
}

export async function requireUser(nextPath = "/dashboard"): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return profile;
}

export async function requireAdmin(nextPath = "/admin"): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!profile.is_active || (profile.role !== "admin" && profile.role !== "officer")) {
    redirect("/dashboard");
  }
  return profile;
}
