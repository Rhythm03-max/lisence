"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { slugify } from "@/lib/format";
import type { ActionResult } from "@/lib/actions/auth";

async function assertAdmin(): Promise<ActionResult | null> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active || (profile.role !== "admin" && profile.role !== "officer")) {
    return { ok: false, error: "Not authorised." };
  }
  return null;
}

function refreshContent() {
  revalidatePath("/admin/content");
  revalidatePath("/news");
  revalidatePath("/faq-notices");
}

export async function createNewsAction(formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("news").insert({
    title,
    slug: slugify(title),
    body: (formData.get("body") as string) || null,
    category: (formData.get("category") as string) || "event",
    is_active: true,
    published_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  refreshContent();
  return { ok: true, message: "News item created." };
}

export async function updateNewsAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const title = String(formData.get("title") ?? "").trim();
  const supabase = await createClient();
  const { error } = await supabase
    .from("news")
    .update({
      title,
      slug: slugify(title),
      body: (formData.get("body") as string) || null,
      category: (formData.get("category") as string) || "event",
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshContent();
  return { ok: true, message: "News item updated." };
}

export async function toggleNewsActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.from("news").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshContent();
  return { ok: true, message: isActive ? "Published." : "Unpublished." };
}

export async function deleteNewsAction(id: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshContent();
  return { ok: true, message: "News item deleted." };
}

export async function createFaqAction(formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!question || !answer) return { ok: false, error: "Question and answer are required." };

  const supabase = await createClient();
  const { error } = await supabase.from("faqs").insert({
    question,
    answer,
    type: (formData.get("type") as string) || "faq",
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_active: true,
  });
  if (error) return { ok: false, error: error.message };
  refreshContent();
  return { ok: true, message: "Entry created." };
}

export async function updateFaqAction(id: string, formData: FormData): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase
    .from("faqs")
    .update({
      question: String(formData.get("question") ?? "").trim(),
      answer: String(formData.get("answer") ?? "").trim(),
      type: (formData.get("type") as string) || "faq",
      sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshContent();
  return { ok: true, message: "Entry updated." };
}

export async function toggleFaqActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.from("faqs").update({ is_active: isActive }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshContent();
  return { ok: true, message: isActive ? "Enabled." : "Disabled." };
}

export async function deleteFaqAction(id: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.from("faqs").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  refreshContent();
  return { ok: true, message: "Entry deleted." };
}
