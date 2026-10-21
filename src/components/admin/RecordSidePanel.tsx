"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  archivePermitRecordAction,
  generateRecordCertificateAction,
  rotateVerificationTokenAction,
  setPermitPhotoAction,
} from "@/lib/actions/admin";
import { publicDocumentUrl } from "@/lib/storage";
import type { PermitRecord } from "@/lib/types";

export function RecordSidePanel({
  record,
  photoUrl,
  verificationUrl,
  publicUrl,
  children,
}: {
  record: PermitRecord;
  photoUrl: string | null;
  verificationUrl: string;
  publicUrl: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [token, setToken] = useState(record.verification_token);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(publicDocumentUrl(record.document_path));

  const currentVerificationUrl = verificationUrl.replace(/[^/]+$/, token);
  const qrSrc = `/api/qr?size=320&data=${encodeURIComponent(currentVerificationUrl)}`;

  async function onPhoto(file: File) {
    setBusy(true);
    setError("");
    setStatus("");
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${record.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("permit-photos").upload(path, file, { upsert: false });
    if (uploadError) {
      setBusy(false);
      setError(uploadError.message);
      return;
    }
    const result = await setPermitPhotoAction(record.id, path);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not save the photo.");
      return;
    }
    setStatus("Photo updated.");
    router.refresh();
  }

  async function onRotate() {
    if (!window.confirm("Rotate the verification token? The old QR code and link will stop working.")) return;
    setBusy(true);
    setError("");
    setStatus("");
    const result = await rotateVerificationTokenAction(record.id);
    setBusy(false);
    if (!result.ok || !result.token) {
      setError(result.error ?? "Could not rotate the token.");
      return;
    }
    setToken(result.token);
    setStatus("Verification token rotated.");
    router.refresh();
  }

  async function onGenerateCertificate() {
    setBusy(true);
    setError("");
    setStatus("");
    const result = await generateRecordCertificateAction(record.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not generate the certificate.");
      return;
    }
    setCertificateUrl(result.url ?? publicDocumentUrl(record.document_path));
    setStatus("Certificate generated.");
    router.refresh();
  }

  async function onCopyPublic() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setError("");
      setStatus("Public link copied.");
    } catch {
      setError("Could not copy the link.");
    }
  }

  async function onArchive() {
    if (!window.confirm("Archive this record? It will no longer be publicly searchable.")) return;
    setBusy(true);
    setError("");
    const result = await archivePermitRecordAction(record.id, true);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not archive the record.");
      return;
    }
    router.push("/admin/records");
    router.refresh();
  }

  return (
    <div className="record-detail-grid">
      {children}

      <aside>
        <section className="admin-panel">
          <div className="panel-heading"><div><span>02</span><h2>Candidate image</h2></div></div>
          <div style={{ padding: 20 }}>
            <div className="permit-photo has-photo" style={{ width: 120, height: 140, marginBottom: 14 }}>
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Candidate" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span>NO PHOTO</span>
              )}
            </div>
            <label className="photo-upload" htmlFor="record-photo">
              <span className="photo-upload-icon" aria-hidden="true">↑</span>
              <span><strong>Upload photograph</strong><small>JPG or PNG · passport-style portrait</small></span>
              <input
                id="record-photo"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPhoto(file);
                }}
              />
            </label>
          </div>
        </section>

        <section className="admin-panel" style={{ marginTop: 22 }}>
          <div className="panel-heading"><div><span>03</span><h2>Verification QR</h2></div><span className="live-badge">LIVE</span></div>
          <div className="qr-panel" style={{ margin: 0, border: 0 }}>
            <div>
              <p className="admin-eyebrow">SECURE VERIFICATION</p>
              <p>Links directly to the holder&apos;s public profile without exposing its database ID.</p>
              <a className="qr-public-link" href={currentVerificationUrl} target="_blank" rel="noopener">Open public profile</a>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt="Verification QR code" width={142} height={142} />
            <div className="qr-actions">
              <a className="admin-primary" href={`/api/qr?size=1200&data=${encodeURIComponent(currentVerificationUrl)}`} download="verification-qr.png">Download 1200px PNG</a>
              <a className="admin-secondary" href={`/api/qr?format=svg&size=1200&data=${encodeURIComponent(currentVerificationUrl)}`} download="verification-qr.svg" style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>Download SVG</a>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <code style={{ display: "block", wordBreak: "break-all", fontSize: 10, color: "#557" }}>{token}</code>
            <button className="admin-secondary" type="button" onClick={onRotate} disabled={busy} style={{ marginTop: 10, width: "100%" }}>Rotate token</button>
          </div>
        </section>

        <section className="admin-panel" style={{ marginTop: 22 }}>
          <div className="panel-heading"><div><span>04</span><h2>Public link</h2></div></div>
          <div style={{ padding: 20 }}>
            <p style={{ marginTop: 0, color: "#667", fontSize: 12 }}>
              Anyone can open this URL to view the permit record. The certificate QR code points here.
            </p>
            <code style={{ display: "block", wordBreak: "break-all", fontSize: 10, color: "#557", marginBottom: 10 }}>{publicUrl}</code>
            <div className="qr-actions">
              <a className="admin-primary" href={publicUrl} target="_blank" rel="noopener">Open</a>
              <button className="admin-secondary" type="button" onClick={onCopyPublic}>Copy link</button>
            </div>
          </div>
        </section>

        <section className="admin-panel" style={{ marginTop: 22 }}>
          <div className="panel-heading"><div><span>05</span><h2>Permit certificate</h2></div></div>
          <div style={{ padding: 20 }}>
            <p style={{ marginTop: 0, color: "#667", fontSize: 12 }}>
              Generate a printable PDF certificate. It embeds a QR code that links to this permit&apos;s public search page.
            </p>
            <button
              className="admin-primary"
              type="button"
              onClick={onGenerateCertificate}
              disabled={busy}
              style={{ width: "100%" }}
            >
              {busy ? "Generating…" : certificateUrl ? "Regenerate certificate" : "Generate certificate"}
            </button>
            {certificateUrl && (
              <a
                className="admin-secondary"
                href={certificateUrl}
                target="_blank"
                rel="noopener"
                style={{ display: "grid", placeItems: "center", textDecoration: "none", width: "100%", marginTop: 10 }}
              >
                Download PDF
              </a>
            )}
          </div>
        </section>

        <section className="admin-panel" style={{ marginTop: 22 }}>
          <div className="panel-heading"><div><span>06</span><h2>Danger zone</h2></div></div>
          <div style={{ padding: 20 }}>
            <p style={{ marginTop: 0, color: "#667", fontSize: 12 }}>Archiving removes the record from public search and verification.</p>
            <button
              type="button"
              onClick={onArchive}
              disabled={busy}
              style={{ width: "100%", height: 39, color: "#b13d3d", border: "1px solid #e1bcbc", borderRadius: 4, background: "#fff", cursor: "pointer", fontWeight: 700 }}
            >
              Archive record
            </button>
          </div>
        </section>

        {(error || status) && (
          <p className={`admin-form-status${error ? " error" : ""}`} aria-live="polite" style={{ padding: "0 2px" }}>{error || status}</p>
        )}
      </aside>
    </div>
  );
}
