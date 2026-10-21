"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createPermitRecordAction, setPermitPhotoAction, updatePermitRecordAction } from "@/lib/actions/admin";
import { publicPhotoUrl } from "@/lib/storage";
import type { Permit, PermitRecord } from "@/lib/types";

function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function composePermitNumber(prefix: string, sequence: string) {
  const head = prefix.trim().replace(/-+$/, "");
  const tail = sequence.trim().replace(/^-+/, "");
  if (head && tail) return `${head}-${tail}`;
  return head || tail;
}

export function RecordForm({
  permits,
  record,
}: {
  permits: Permit[];
  record?: PermitRecord;
}) {
  const router = useRouter();
  const editing = Boolean(record);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [prefix] = useState("MOL-WP");
  const [sequence, setSequence] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const composed = composePermitNumber(prefix, sequence);
  const preview = photoPreview ?? publicPhotoUrl(record?.photo_path);

  function onPickPhoto(file: File | null) {
    setPhoto(file);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function uploadPhoto(recordId: string, file: File) {
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${recordId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("permit-photos")
      .upload(path, file, { upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const result = await setPermitPhotoAction(recordId, path);
    if (!result.ok) throw new Error(result.error ?? "Could not save the photo.");
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const conditions = String(data.get("conditions") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload = {
      permit_id: (data.get("permit_id") as string) || null,
      permit_number: editing
        ? String(data.get("permit_number") ?? "").trim()
        : composePermitNumber(prefix, sequence),
      status: String(data.get("status") ?? "Active"),
      authority: String(data.get("authority") ?? "").trim(),
      surname: String(data.get("surname") ?? "").trim(),
      first_name: String(data.get("first_name") ?? "").trim(),
      nationality: (data.get("nationality") as string) || null,
      gender: (data.get("gender") as string) || null,
      passport_number: (data.get("passport_number") as string) || null,
      date_of_birth: (data.get("date_of_birth") as string) || null,
      employer: (data.get("employer") as string) || null,
      post_held: (data.get("post_held") as string) || null,
      issued_date: (data.get("issued_date") as string) || null,
      valid_from: (data.get("valid_from") as string) || null,
      valid_to: (data.get("valid_to") as string) || null,
      conditions,
    };

    setBusy(true);
    setError("");
    setStatus("");

    const result = editing
      ? await updatePermitRecordAction(record!.id, payload)
      : await createPermitRecordAction(payload);

    if (!result.ok) {
      setBusy(false);
      setError(result.error ?? "Could not save the record.");
      return;
    }

    const recordId = editing
      ? record!.id
      : (result as { id?: string }).id;

    if (photo && recordId) {
      try {
        await uploadPhoto(recordId, photo);
      } catch (uploadError) {
        setBusy(false);
        setError(uploadError instanceof Error ? uploadError.message : "Could not upload the photo.");
        return;
      }
    }

    setBusy(false);

    if (!editing && recordId) {
      router.push(`/admin/records/${recordId}`);
      router.refresh();
      return;
    }

    setStatus("Record saved.");
    router.refresh();
  }

  return (
    <form className="candidate-editor" onSubmit={onSubmit} noValidate>
      <fieldset>
        <legend>Permit information</legend>
        <div className="admin-fields two-columns">
          <label>Permit type
            <select name="permit_id" defaultValue={record?.permit_id ?? ""}>
              <option value="">— None —</option>
              {permits.map((permit) => (
                <option key={permit.id} value={permit.id}>{permit.name}</option>
              ))}
            </select>
          </label>
          {editing ? (
            <label>Permit number
              <input name="permit_number" defaultValue={record?.permit_number ?? ""} placeholder="MOL-WP-2026-23794" required />
            </label>
          ) : (
            <>
              <label>Permit series (prefix)
                <input
                  name="prefix"
                  value={prefix}
                  readOnly
                  aria-readonly="true"
                  placeholder="MOL-WP"
                />
              </label>
              <label>Registration number
                <input
                  name="sequence"
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  placeholder="2026-23794"
                  required
                />
              </label>
            </>
          )}
          <label>Status
            <select name="status" defaultValue={record?.status ?? "Active"} required>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
          <label className="full-field">Issuing authority
            <input name="authority" defaultValue={record?.authority ?? "Ministry of Labour and Industrial Relations"} required />
          </label>
        </div>
        {!editing && (
          <p className="field-help" style={{ padding: "0 4px" }}>
            Unique permit ID: <strong>{composed || "—"}</strong>
            {composed && <> · public link <code>/publicsearch/wp/{composed}</code></>}
          </p>
        )}
      </fieldset>

      <fieldset>
        <legend>Personal information</legend>
        <div className="admin-fields two-columns">
          <label>Surname<input name="surname" defaultValue={record?.surname ?? ""} required /></label>
          <label>First name<input name="first_name" defaultValue={record?.first_name ?? ""} required /></label>
          <label>Nationality<input name="nationality" defaultValue={record?.nationality ?? ""} /></label>
          <label>Gender
            <select name="gender" defaultValue={record?.gender ?? ""}>
              <option value="">Select gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </label>
          <label>Passport number<input name="passport_number" defaultValue={record?.passport_number ?? ""} /></label>
          <label>Date of birth<input name="date_of_birth" type="date" defaultValue={toDateInput(record?.date_of_birth)} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Employment and validity</legend>
        <div className="admin-fields two-columns">
          <label className="full-field">Name of employer<input name="employer" defaultValue={record?.employer ?? ""} /></label>
          <label className="full-field">Post held<input name="post_held" defaultValue={record?.post_held ?? ""} placeholder="Machine Operator, Textiles" /></label>
          <label>Issue date<input name="issued_date" type="date" defaultValue={toDateInput(record?.issued_date)} /></label>
          <label>Validity from<input name="valid_from" type="date" defaultValue={toDateInput(record?.valid_from)} /></label>
          <label>Validity to<input name="valid_to" type="date" defaultValue={toDateInput(record?.valid_to)} /></label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Photograph</legend>
        <div className="record-photo-field">
          <div className="permit-photo has-photo" style={{ width: 120, height: 140 }}>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Permit holder" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span>NO PHOTO</span>
            )}
          </div>
          <label className="photo-upload" htmlFor="record-form-photo">
            <span className="photo-upload-icon" aria-hidden="true">↑</span>
            <span><strong>{photo ? photo.name : "Upload photograph"}</strong><small>JPG or PNG · passport-style portrait</small></span>
            <input
              id="record-form-photo"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => onPickPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Permit conditions</legend>
        <label className="admin-textarea-label">One condition per line
          <textarea name="conditions" rows={4} defaultValue={(record?.conditions ?? [
            "This permit is valid for the period indicated above.",
            "This permit is personal to the holder and is not transferable.",
          ]).join("\n")} />
        </label>
      </fieldset>

      <p className={`admin-form-status${error ? " error" : ""}`} aria-live="polite">{error || status}</p>
      <div className="admin-form-actions">
        <button className="admin-secondary" type="button" onClick={() => router.back()}>Cancel</button>
        <button className="admin-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : editing ? "Save changes" : "Create record"}
        </button>
      </div>
    </form>
  );
}
