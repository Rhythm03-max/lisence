"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { storeApplicationConfirmation } from "@/lib/documents";
import { getSiteUrl } from "@/lib/site-url";
import type { ActionResult } from "@/lib/actions/auth";
import type { Application, ApplicationDocument, Permit } from "@/lib/types";

export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "You are not signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      title: (formData.get("title") as string) || null,
      first_name: (formData.get("first_name") as string) || null,
      last_name: (formData.get("last_name") as string) || null,
      gender: (formData.get("gender") as string) || null,
      mobile: (formData.get("mobile") as string) || null,
      nationality: (formData.get("nationality") as string) || null,
      passport_number: (formData.get("passport_number") as string) || null,
      date_of_birth: (formData.get("date_of_birth") as string) || null,
      address: (formData.get("address") as string) || null,
    })
    .eq("id", profile.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true, message: "Your profile has been updated." };
}

export async function createDraftApplicationAction(permitId: string): Promise<ActionResult & { applicationId?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "You are not signed in." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .insert({ applicant_id: profile.id, permit_id: permitId, status: "draft", form_data: {} })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, applicationId: data.id };
}

export async function saveApplicationDocumentAction(
  applicationId: string,
  documentType: string,
  filePath: string,
  fileName: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_application_document", {
    p_application_id: applicationId,
    p_document_type: documentType,
    p_file_path: filePath,
    p_file_name: fileName,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitApplicationAction(
  applicationId: string,
  formData: Record<string, unknown>,
): Promise<ActionResult & { reference?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "You are not signed in." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_application", {
    p_application_id: applicationId,
    p_form_data: formData,
  });
  if (error) return { ok: false, error: error.message };

  const application = data as Application | null;

  if (application) {
    try {
      const [permitResult, documentsResult, siteUrl] = await Promise.all([
        application.permit_id
          ? supabase.from("permits").select("*").eq("id", application.permit_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("application_documents")
          .select("*")
          .eq("application_id", application.id)
          .order("uploaded_at", { ascending: false }),
        getSiteUrl(),
      ]);

      await storeApplicationConfirmation(supabase, {
        application,
        permit: (permitResult.data as Permit) ?? null,
        profile,
        documents: (documentsResult.data ?? []) as ApplicationDocument[],
        siteUrl,
      });
    } catch (pdfError) {
      console.error("[submit] Could not generate acknowledgement PDF", pdfError);
    }
  }

  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/dashboard");
  return { ok: true, reference: application?.reference };
}

export async function cancelApplicationAction(applicationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_application", { p_application_id: applicationId });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/applications");
  revalidatePath(`/applications/${applicationId}`);
  return { ok: true, message: "Application cancelled." };
}
