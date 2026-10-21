"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { loadApplicationPhoto, storeRecordCertificate } from "@/lib/documents";
import { getSiteUrl } from "@/lib/site-url";
import { permitPublicUrl } from "@/lib/permalink";
import { sendMail } from "@/lib/mail";
import type { ActionResult } from "@/lib/actions/auth";
import type { PermitRecord } from "@/lib/types";

async function assertAdmin(): Promise<ActionResult | null> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.is_active || (profile.role !== "admin" && profile.role !== "officer")) {
    return { ok: false, error: "Not authorised." };
  }
  return null;
}

export interface PermitRecordInput {
  id?: string;
  permit_id?: string | null;
  permit_number?: string;
  status?: string;
  authority?: string;
  surname?: string;
  first_name?: string;
  nationality?: string | null;
  gender?: string | null;
  passport_number?: string | null;
  date_of_birth?: string | null;
  employer?: string | null;
  post_held?: string | null;
  issued_date?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  conditions?: string[] | null;
  photo_path?: string | null;
}

export async function createPermitRecordAction(
  input: PermitRecordInput,
): Promise<ActionResult & { id?: string; permitNumber?: string }> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_create_permit_record", { p_candidate: input });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/records");
  return { ok: true, id: data?.id, permitNumber: data?.permit_number };
}

export async function updatePermitRecordAction(
  id: string,
  input: PermitRecordInput,
): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_update_permit_record", { p_id: id, p_candidate: input });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/records");
  revalidatePath(`/admin/records/${id}`);
  return { ok: true, message: "Permit record updated." };
}

export async function archivePermitRecordAction(id: string, archived: boolean): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_archive_permit_record", { p_id: id, p_archived: archived });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/records");
  revalidatePath(`/admin/records/${id}`);
  return { ok: true, message: archived ? "Record archived." : "Record restored." };
}

export async function setPermitPhotoAction(id: string, photoPath: string | null): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_permit_photo", { p_id: id, p_photo_path: photoPath });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/records/${id}`);
  return { ok: true, message: "Photo updated." };
}

export async function rotateVerificationTokenAction(id: string): Promise<ActionResult & { token?: string }> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_rotate_verification_token", { p_id: id });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/records/${id}`);
  return { ok: true, token: data as string };
}

export async function generateRecordCertificateAction(
  id: string,
): Promise<ActionResult & { url?: string | null }> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data: recordRow } = await supabase
    .from("permit_records")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!recordRow) return { ok: false, error: "Permit record not found." };

  const record = recordRow as PermitRecord;
  const { data: permitRow } = record.permit_id
    ? await supabase.from("permits").select("name").eq("id", record.permit_id).maybeSingle()
    : { data: null };

  const siteUrl = await getSiteUrl();
  const certificate = await storeRecordCertificate(supabase, {
    record,
    permitName: (permitRow as { name?: string } | null)?.name ?? null,
    siteUrl,
  });
  if (!certificate) return { ok: false, error: "Could not generate the certificate." };

  revalidatePath(`/admin/records/${id}`);
  revalidatePath("/admin/records");
  revalidatePath("/search-permits");
  return { ok: true, url: certificate.url, message: "Certificate generated." };
}

export type ReviewDecision = "approve" | "reject" | "more_info" | "review";

/**
 * On approval: copy the applicant photograph onto the public record, generate
 * the professional certificate PDF (with a QR linking back to the online
 * permit), and email the applicant a copy. Failures here never block approval.
 */
async function issueCertificateAndNotify(
  supabase: SupabaseClient,
  input: { recordId: string; applicationId: string; applicantId: string; permitId?: string | null },
): Promise<void> {
  try {
    const { data: recordRow } = await supabase
      .from("permit_records")
      .select("*")
      .eq("id", input.recordId)
      .maybeSingle();
    if (!recordRow) return;
    let record = recordRow as PermitRecord;

    const { data: permitRow } = input.permitId
      ? await supabase.from("permits").select("name").eq("id", input.permitId).maybeSingle()
      : { data: null };

    const photo = await loadApplicationPhoto(supabase, input.applicationId);
    if (photo) {
      const photoPath = `${record.id}.${photo.type}`;
      const { error: photoError } = await supabase.storage
        .from("permit-photos")
        .upload(photoPath, photo.bytes, {
          upsert: true,
          contentType: photo.type === "png" ? "image/png" : "image/jpeg",
        });
      if (!photoError) {
        await supabase.from("permit_records").update({ photo_path: photoPath }).eq("id", record.id);
        record = { ...record, photo_path: photoPath };
      }
    }

    const siteUrl = await getSiteUrl();
    const certificate = await storeRecordCertificate(supabase, {
      record,
      permitName: (permitRow as { name?: string } | null)?.name ?? null,
      siteUrl,
      photo,
    });

    const { data: applicant } = await supabase
      .from("profiles")
      .select("first_name, last_name, email")
      .eq("id", input.applicantId)
      .maybeSingle();

    const email = (applicant?.email as string | undefined) ?? null;
    if (!email) return;

    const holderName =
      [applicant?.first_name, applicant?.last_name].filter(Boolean).join(" ") || record.first_name;
    const download =
      certificate?.url ?? permitPublicUrl(siteUrl, record.permit_number);

    await sendMail({
      to: email,
      subject: `Your permit ${record.permit_number} has been approved`,
      text: [
        `Dear ${holderName},`,
        "",
        `We are pleased to inform you that your application has been approved and your permit has been issued.`,
        `Permit number: ${record.permit_number}`,
        `Authority: ${record.authority}`,
        `Validity: ${record.valid_from ?? "—"} to ${record.valid_to ?? "—"}`,
        "",
        `You can download your permit certificate here: ${download}`,
        "",
        "National Electronic Licensing System",
      ].join("\n"),
      html: [
        `<p>Dear ${holderName},</p>`,
        `<p>We are pleased to inform you that your application has been approved and your permit has been issued.</p>`,
        `<p><strong>Permit number:</strong> ${record.permit_number}<br/>`,
        `<strong>Authority:</strong> ${record.authority}<br/>`,
        `<strong>Validity:</strong> ${record.valid_from ?? "—"} to ${record.valid_to ?? "—"}</p>`,
        `<p><a href="${download}">Download your permit certificate</a></p>`,
        `<p>National Electronic Licensing System</p>`,
      ].join(""),
      attachments: certificate
        ? [
            {
              filename: `permit-${record.permit_number}.pdf`,
              content: certificate.pdf,
              contentType: "application/pdf",
            },
          ]
        : undefined,
    });
  } catch (error) {
    console.error("[approve] Could not issue certificate or notify applicant", error);
  }
}

export async function reviewApplicationAction(
  id: string,
  decision: ReviewDecision,
  notes?: string,
): Promise<ActionResult & { recordId?: string }> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_review_application", {
    p_id: id,
    p_decision: decision,
    p_notes: notes ?? null,
  });
  if (error) return { ok: false, error: error.message };

  const application = data as
    | { issued_record_id?: string | null; applicant_id?: string; permit_id?: string | null }
    | null;

  if (decision === "approve" && application?.issued_record_id && application.applicant_id) {
    await issueCertificateAndNotify(supabase, {
      recordId: application.issued_record_id,
      applicationId: id,
      applicantId: application.applicant_id,
      permitId: application.permit_id ?? null,
    });
  }

  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/applications");
  return { ok: true, recordId: application?.issued_record_id ?? undefined };
}

export async function setProfileRoleAction(userId: string, role: string): Promise<ActionResult> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_profile_role", { p_id: userId, p_role: role });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true, message: "Role updated." };
}

export async function toggleProfileActiveAction(userId: string): Promise<ActionResult & { isActive?: boolean }> {
  const denied = await assertAdmin();
  if (denied) return denied;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_toggle_profile_active", { p_id: userId });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/users");
  return { ok: true, isActive: data as boolean };
}
