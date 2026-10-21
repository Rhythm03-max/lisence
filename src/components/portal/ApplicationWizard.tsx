"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createDraftApplicationAction,
  saveApplicationDocumentAction,
  submitApplicationAction,
} from "@/lib/actions/applicant";
import { GENDER_OPTIONS, PHOTO_DOCUMENT_TYPE, TITLE_OPTIONS } from "@/lib/constants";
import type { Permit, Profile } from "@/lib/types";

interface Uploaded {
  documentType: string;
  fileName: string;
}

const DETAIL_FIELDS = [
  "business_name",
  "business_address",
  "contact_address",
  "contact_phone",
  "contact_email",
  "title",
  "first_name",
  "surname",
  "nationality",
  "gender",
  "passport_number",
  "date_of_birth",
  "employer",
  "post_held",
] as const;

export function ApplicationWizard({
  permit,
  profile,
  existingApplicationId,
  initialFormData,
}: {
  permit: Permit;
  profile: Profile;
  existingApplicationId?: string;
  initialFormData?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(existingApplicationId ? 1 : 0);
  const [applicationId, setApplicationId] = useState(existingApplicationId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploads, setUploads] = useState<Record<string, Uploaded>>({});
  const uploadSeq = useRef(0);

  const initial = initialFormData ?? {};
  const [details, setDetails] = useState<Record<string, unknown>>(() => ({
    business_name: initial.business_name ?? "",
    business_address: initial.business_address ?? "",
    contact_address: initial.contact_address ?? profile.address ?? "",
    contact_phone: initial.contact_phone ?? profile.mobile ?? "",
    contact_email: initial.contact_email ?? profile.email ?? "",
    title: initial.title ?? profile.title ?? "",
    first_name: initial.first_name ?? profile.first_name ?? "",
    surname: initial.surname ?? profile.last_name ?? "",
    nationality: initial.nationality ?? profile.nationality ?? "",
    gender: initial.gender ?? profile.gender ?? "",
    passport_number: initial.passport_number ?? profile.passport_number ?? "",
    date_of_birth: initial.date_of_birth ?? profile.date_of_birth ?? "",
    employer: initial.employer ?? "",
    post_held: initial.post_held ?? "",
  }));

  const documents = permit.required_documents ?? [];
  const steps = ["Requirements", "Documents", "Your details", "Review & submit"];

  async function begin() {
    if (applicationId) {
      setStep(1);
      return;
    }
    setBusy(true);
    setError("");
    const result = await createDraftApplicationAction(permit.id);
    setBusy(false);
    if (!result.ok || !result.applicationId) {
      setError(result.error ?? "Could not start the application.");
      return;
    }
    setApplicationId(result.applicationId);
    setStep(1);
  }

  async function onUpload(documentType: string, file: File) {
    if (!applicationId) return;
    setError("");
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    uploadSeq.current += 1;
    const path = `${applicationId}/${uploadSeq.current}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("application-documents")
      .upload(path, file, { upsert: false });
    if (uploadError) {
      setError(uploadError.message);
      return;
    }
    const saved = await saveApplicationDocumentAction(applicationId, documentType, path, file.name);
    if (!saved.ok) {
      setError(saved.error ?? "Could not attach the document.");
      return;
    }
    setUploads((prev) => ({ ...prev, [documentType]: { documentType, fileName: file.name } }));
  }

  function goToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: Record<string, unknown> = { ...details };
    for (const key of DETAIL_FIELDS) {
      next[key] = (data.get(key) as string) ?? "";
    }
    setDetails(next);
    setStep(3);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!applicationId) {
      setError("Start the application before submitting.");
      return;
    }
    const formData: Record<string, unknown> = {
      ...details,
      declaration: new FormData(event.currentTarget).get("declaration") === "on",
    };
    setBusy(true);
    setError("");
    const result = await submitApplicationAction(applicationId, formData);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not submit the application.");
      return;
    }
    router.push(`/applications/${applicationId}`);
    router.refresh();
  }

  const val = (key: string) => String(details[key] ?? "");

  return (
    <div className="panel-card">
      <header><h2>{permit.name}</h2></header>
      <div className="panel-body">
        <div className="stepper">
          {steps.map((label, index) => (
            <div
              key={label}
              className={`stepper-step ${index === step ? "active" : index < step ? "done" : ""}`}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>

        {error && <p className="form-status error" aria-live="polite">{error}</p>}

        {step === 0 && (
          <div>
            <p>Please review the requirements before you begin. You can save your progress and return at any time.</p>
            {permit.steps.length > 0 && (
              <>
                <h3>Process</h3>
                <ol>
                  {permit.steps.map((s, i) => (
                    <li key={i} style={{ marginBottom: 8 }}>
                      <strong>{s.title}</strong>
                      {s.description && <div style={{ color: "#667" }}>{s.description}</div>}
                    </li>
                  ))}
                </ol>
              </>
            )}
            {documents.length > 0 && (
              <>
                <h3>Documents you will need</h3>
                <ul>
                  <li>Applicant photograph (required)</li>
                  {documents.map((doc, i) => (
                    <li key={i}>{doc.label}{doc.required ? " (required)" : ""}</li>
                  ))}
                </ul>
              </>
            )}
            <div className="account-actions-row" style={{ marginTop: 18 }}>
              <button className="secondary-action" type="button" onClick={() => router.push(`/permits/${permit.slug}`)}>Cancel</button>
              <button className="primary-action" type="button" onClick={begin} disabled={busy}>
                {busy ? "Starting…" : existingApplicationId ? "Continue" : "Begin application"}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3>Upload required documents</h3>
            <div className="upload-row">
              <div>
                <strong>Applicant photograph</strong>
                <small>Required · JPG or PNG</small>
                {uploads[PHOTO_DOCUMENT_TYPE] && <span className="upload-done"> ✓ {uploads[PHOTO_DOCUMENT_TYPE].fileName}</span>}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUpload(PHOTO_DOCUMENT_TYPE, file);
                }}
              />
            </div>
            {documents.map((doc, i) => (
              <div className="upload-row" key={i}>
                <div>
                  <strong>{doc.label}</strong>
                  <small>{doc.required ? "Required" : "Optional"}</small>
                  {uploads[doc.label] && <span className="upload-done"> ✓ {uploads[doc.label].fileName}</span>}
                </div>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(doc.label, file);
                  }}
                />
              </div>
            ))}
            <div className="account-actions-row" style={{ marginTop: 18 }}>
              <button className="secondary-action" type="button" onClick={() => setStep(0)}>Back</button>
              <button className="primary-action" type="button" onClick={() => setStep(2)}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form id="details-form" onSubmit={goToReview} noValidate>
            <h3>Business details</h3>
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="business_name">Proposed business / activity name</label>
                <input id="business_name" name="business_name" defaultValue={val("business_name")} required />
              </div>
              <div className="field">
                <label htmlFor="business_address">Proposed business address</label>
                <input id="business_address" name="business_address" defaultValue={val("business_address")} required />
              </div>
              <div className="field">
                <label htmlFor="contact_phone">Contact phone</label>
                <input id="contact_phone" name="contact_phone" defaultValue={val("contact_phone")} />
              </div>
              <div className="field">
                <label htmlFor="contact_email">Contact email</label>
                <input id="contact_email" name="contact_email" type="email" defaultValue={val("contact_email")} />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="contact_address">Correspondence address</label>
                <input id="contact_address" name="contact_address" defaultValue={val("contact_address")} />
              </div>
            </div>

            <h3 style={{ marginTop: 22 }}>Permit holder details</h3>
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="title">Title</label>
                <select id="title" name="title" defaultValue={val("title")}>
                  <option value="">—</option>
                  {TITLE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="surname">Surname</label>
                <input id="surname" name="surname" defaultValue={val("surname")} required />
              </div>
              <div className="field">
                <label htmlFor="first_name">First name</label>
                <input id="first_name" name="first_name" defaultValue={val("first_name")} required />
              </div>
              <div className="field">
                <label htmlFor="nationality">Nationality</label>
                <input id="nationality" name="nationality" defaultValue={val("nationality")} />
              </div>
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" defaultValue={val("gender")}>
                  <option value="">—</option>
                  {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="passport_number">Passport number</label>
                <input id="passport_number" name="passport_number" defaultValue={val("passport_number")} />
              </div>
              <div className="field">
                <label htmlFor="date_of_birth">Date of birth</label>
                <input id="date_of_birth" name="date_of_birth" type="date" defaultValue={val("date_of_birth")} />
              </div>
              <div className="field">
                <label htmlFor="employer">Name of employer</label>
                <input id="employer" name="employer" defaultValue={val("employer")} />
              </div>
              <div className="field">
                <label htmlFor="post_held">Post held</label>
                <input id="post_held" name="post_held" defaultValue={val("post_held")} />
              </div>
            </div>
            <div className="account-actions-row" style={{ marginTop: 18 }}>
              <button className="secondary-action" type="button" onClick={() => setStep(1)}>Back</button>
              <button className="primary-action" type="submit">Continue</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={onSubmit} noValidate>
            <p>Please confirm the declaration below and submit your application.</p>
            <ul>
              <li>Permit: <strong>{permit.name}</strong></li>
              <li>Applicant: <strong>{[val("first_name"), val("surname")].filter(Boolean).join(" ") || "—"}</strong></li>
              <li>Documents attached: <strong>{Object.keys(uploads).length}</strong></li>
            </ul>
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", margin: "14px 0" }}>
              <input type="checkbox" name="declaration" required />
              <span>I declare that the information provided is true and correct. I understand that providing false information may lead to refusal of the application.</span>
            </label>
            <div className="account-actions-row">
              <button className="secondary-action" type="button" onClick={() => setStep(2)}>Back</button>
              <button className="primary-action" type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit application"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
