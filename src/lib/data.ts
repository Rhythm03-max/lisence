import { createClient } from "@/lib/supabase/server";
import type { Agency, FaqItem, NewsItem, Permit, PermitCategory } from "@/lib/types";

export interface CategoryGroup {
  id: string;
  name: string;
  slug: string;
  permits: Permit[];
}

export interface AgencyGroup {
  id: string;
  name: string;
  slug: string;
  permits: Permit[];
}

export interface Catalog {
  categories: CategoryGroup[];
  agencies: AgencyGroup[];
  permits: Permit[];
}

function byName(a: Permit, b: Permit) {
  return a.name.localeCompare(b.name);
}

export async function getCatalog(): Promise<Catalog> {
  try {
    const supabase = await createClient();
    const [catRes, agencyRes, permitRes] = await Promise.all([
      supabase.from("permit_categories").select("*").order("sort_order"),
      supabase.from("agencies").select("*").order("sort_order"),
      supabase.from("permits").select("*").eq("is_active", true).order("name"),
    ]);

    const categories = (catRes.data ?? []) as PermitCategory[];
    const agencies = (agencyRes.data ?? []) as Agency[];
    const permits = (permitRes.data ?? []) as Permit[];

    const categoryGroups: CategoryGroup[] = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      permits: permits.filter((p) => p.category_id === c.id).sort(byName),
    }));

    const agencyGroups: AgencyGroup[] = agencies.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      permits: permits.filter((p) => p.agency_id === a.id).sort(byName),
    }));

    return { categories: categoryGroups, agencies: agencyGroups, permits };
  } catch {
    return { categories: [], agencies: [], permits: [] };
  }
}

export async function getPermitBySlug(slug: string): Promise<Permit | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("permits").select("*").eq("slug", slug).maybeSingle();
    return (data as Permit) ?? null;
  } catch {
    return null;
  }
}

export async function getPermits(): Promise<Permit[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("permits").select("*").eq("is_active", true).order("name");
    return (data ?? []) as Permit[];
  } catch {
    return [];
  }
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("news")
      .select("*")
      .eq("is_active", true)
      .order("published_at", { ascending: false });
    return (data ?? []) as NewsItem[];
  } catch {
    return [];
  }
}

export async function getFaqs(type?: FaqItem["type"]): Promise<FaqItem[]> {
  try {
    const supabase = await createClient();
    let query = supabase.from("faqs").select("*").eq("is_active", true).order("sort_order");
    if (type) query = query.eq("type", type);
    const { data } = await query;
    return (data ?? []) as FaqItem[];
  } catch {
    return [];
  }
}
