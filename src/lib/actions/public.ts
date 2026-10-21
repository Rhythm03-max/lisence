"use server";

import { createClient } from "@/lib/supabase/server";
import { publicPhotoUrl } from "@/lib/storage";
import type { PublicPermit } from "@/lib/types";

export interface PermitSearchResult {
  ok: boolean;
  error?: string;
  permit?: PublicPermit | null;
  photoUrl?: string | null;
}

export async function searchPermitAction(input: {
  permitNumber: string;
  issuedDate?: string;
  holder?: string;
}): Promise<PermitSearchResult> {
  const permitNumber = (input.permitNumber ?? "").trim();
  if (!permitNumber) {
    return { ok: false, error: "Enter a permit number to search." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_public_permit", {
      p_permit_number: permitNumber,
      p_issued_date: input.issuedDate?.trim() ? input.issuedDate.trim() : null,
      p_holder: input.holder?.trim() ? input.holder.trim() : null,
    });

    if (error) return { ok: false, error: "Search failed. Please try again." };
    if (!data) return { ok: true, permit: null };

    const permit = data as PublicPermit;
    return { ok: true, permit, photoUrl: publicPhotoUrl(permit.photo_path) };
  } catch {
    return { ok: false, error: "The permit service is currently unavailable." };
  }
}
