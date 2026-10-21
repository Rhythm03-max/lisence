import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCertificatePdf, buildConfirmationPdf } from "@/lib/pdf";
import { publicDocumentUrl, publicPhotoUrl } from "@/lib/storage";
import { permitPublicUrl } from "@/lib/permalink";
import { PHOTO_DOCUMENT_TYPE } from "@/lib/constants";
import type { Application, ApplicationDocument, Permit, PermitRecord, Profile } from "@/lib/types";

export { PHOTO_DOCUMENT_TYPE };

interface ImagePayload {
  bytes: Uint8Array;
  type: "png" | "jpg";
}

function imageTypeFrom(input: { contentType?: string | null; name?: string | null }): "png" | "jpg" | null {
  const signature = `${input.contentType ?? ""} ${input.name ?? ""}`.toLowerCase();
  if (signature.includes("png")) return "png";
  if (signature.includes("jpg") || signature.includes("jpeg")) return "jpg";
  return null;
}

async function fetchImage(url: string): Promise<ImagePayload | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const type = imageTypeFrom({ contentType: response.headers.get("content-type"), name: url });
    if (!type) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    return { bytes, type };
  } catch {
    return null;
  }
}

/** Locates the applicant-submitted photograph (if any) for an application. */
export async function loadApplicationPhoto(
  supabase: SupabaseClient,
  applicationId: string,
): Promise<(ImagePayload & { path: string }) | null> {
  const { data: documents } = await supabase
    .from("application_documents")
    .select("file_path, file_name, document_type")
    .eq("application_id", applicationId)
    .eq("document_type", PHOTO_DOCUMENT_TYPE)
    .order("uploaded_at", { ascending: false })
    .limit(1);

  const doc = (documents ?? [])[0];
  if (!doc) return null;

  const { data, error } = await supabase.storage.from("application-documents").download(doc.file_path);
  if (error || !data) return null;
  const type = imageTypeFrom({ contentType: data.type, name: doc.file_name ?? doc.file_path });
  if (!type) return null;
  const bytes = new Uint8Array(await data.arrayBuffer());
  return { bytes, type, path: doc.file_path };
}

/** Builds and stores the acknowledgement PDF for a submitted application. */
export async function storeApplicationConfirmation(
  supabase: SupabaseClient,
  input: {
    application: Application;
    permit: Permit | null;
    profile: Profile;
    documents: ApplicationDocument[];
    siteUrl: string;
  },
): Promise<string | null> {
  const { application, permit, profile, documents, siteUrl } = input;

  const known: Record<string, unknown> = {
    ...(application.form_data ?? {}),
  };
  delete known[PHOTO_DOCUMENT_TYPE];

  const applicantName =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    [known.first_name, known.surname].filter(Boolean).join(" ") ||
    profile.email ||
    "Applicant";

  const pdf = await buildConfirmationPdf({
    reference: application.reference,
    permitName: permit?.name ?? "Permit application",
    applicantName,
    applicantEmail: profile.email,
    submittedAt: application.submitted_at,
    formData: known,
    documents: documents.map((doc) => ({
      document_type: doc.document_type,
      file_name: doc.file_name,
    })),
    siteUrl,
  });

  const path = `${application.id}/acknowledgement-${application.reference}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("application-documents")
    .upload(path, pdf, { upsert: true, contentType: "application/pdf" });
  if (uploadError) return null;

  await supabase
    .from("applications")
    .update({ confirmation_pdf_path: path })
    .eq("id", application.id);

  return path;
}

/** Builds and stores the public certificate PDF for an issued permit record. */
export async function storeRecordCertificate(
  supabase: SupabaseClient,
  input: {
    record: PermitRecord;
    permitName?: string | null;
    siteUrl: string;
    photo?: ImagePayload | null;
  },
): Promise<{ path: string; url: string | null; pdf: Uint8Array } | null> {
  const { record, permitName, siteUrl } = input;

  let photo = input.photo ?? null;
  if (!photo && record.photo_path) {
    const url = publicPhotoUrl(record.photo_path);
    if (url) photo = await fetchImage(url);
  }

  const verifyUrl = permitPublicUrl(siteUrl, record.permit_number);
  const pdf = await buildCertificatePdf({
    permitNumber: record.permit_number,
    status: record.status,
    authority: record.authority,
    surname: record.surname,
    firstName: record.first_name,
    nationality: record.nationality,
    gender: record.gender,
    passportNumber: record.passport_number,
    dateOfBirth: record.date_of_birth,
    employer: record.employer,
    postHeld: record.post_held,
    issuedDate: record.issued_date,
    validFrom: record.valid_from,
    validTo: record.valid_to,
    conditions: record.conditions,
    permitName,
    photoBytes: photo?.bytes ?? null,
    photoType: photo?.type ?? null,
    qrData: verifyUrl,
    verifyUrl,
  });

  const path = `${record.id}/certificate-${record.permit_number}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("permit-documents")
    .upload(path, pdf, { upsert: true, contentType: "application/pdf" });
  if (uploadError) return null;

  await supabase.from("permit_records").update({ document_path: path }).eq("id", record.id);

  return { path, url: publicDocumentUrl(path), pdf };
}
