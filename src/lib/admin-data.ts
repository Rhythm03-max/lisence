import { createClient } from "@/lib/supabase/server";
import type { AdminStats, Application, FaqItem, NewsItem, Permit, PermitRecord, Profile } from "@/lib/types";

export async function getAdminStats(): Promise<AdminStats | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_stats");
  return (data as AdminStats) ?? null;
}

export async function listPermitRecords(): Promise<PermitRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_permit_records");
  return (data ?? []) as PermitRecord[];
}

export async function getPermitRecord(id: string): Promise<PermitRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_get_permit_record", { p_id: id });
  return (data as PermitRecord) ?? null;
}

export async function listApplications(): Promise<Application[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_applications");
  return (data ?? []) as Application[];
}

export async function getApplication(id: string): Promise<Application | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_get_application", { p_id: id });
  return (data as Application) ?? null;
}

export async function listProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_profiles");
  return (data ?? []) as Profile[];
}

export async function listPermitsForSelect(): Promise<Permit[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("permits").select("*").order("name");
  return (data ?? []) as Permit[];
}

export async function listNewsAdmin(): Promise<NewsItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("news").select("*").order("published_at", { ascending: false });
  return (data ?? []) as NewsItem[];
}

export async function listFaqsAdmin(): Promise<FaqItem[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("faqs").select("*").order("type").order("sort_order");
  return (data ?? []) as FaqItem[];
}
