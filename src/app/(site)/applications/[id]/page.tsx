import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getMyApplication } from "@/lib/portal";
import { createClient } from "@/lib/supabase/server";
import { publicDocumentUrl } from "@/lib/storage";
import { APPLICATION_STATUS_LABELS, formatDate, formatDateTime, statusClass } from "@/lib/format";
import { ApplicationActions } from "@/components/portal/ApplicationActions";

export const metadata: Metadata = { title: "Application" };

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireUser(`/applications/${id}`);
  const application = await getMyApplication(id, profile.id);
  if (!application) notFound();

  const supabase = await createClient();
  const documents = await Promise.all(
    (application.documents ?? []).map(async (doc) => {
      const { data } = await supabase.storage
        .from("application-documents")
        .createSignedUrl(doc.file_path, 3600);
      return { ...doc, url: data?.signedUrl ?? null };
    }),
  );

  const form = (application.form_data ?? {}) as Record<string, unknown>;

  const confirmationUrl = application.confirmation_pdf_path
    ? (
        await supabase.storage
          .from("application-documents")
          .createSignedUrl(application.confirmation_pdf_path, 3600)
      ).data?.signedUrl ?? null
    : null;

  const certificateUrl = publicDocumentUrl(application.issued_record?.document_path);

  return (
    <main className="portal-main site-width" id="main-content">
      <div className="portal-toolbar">
        <div>
          <p style={{ margin: 0 }}><Link href="/applications">← All applications</Link></p>
          <h1>Application {application.reference}</h1>
          <p>{application.permit?.name ?? "Permit"}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className={`status-pill ${statusClass(application.status)}`}>
            {APPLICATION_STATUS_LABELS[application.status] ?? application.status}
          </span>
        </div>
      </div>

      {application.reviewer_notes && ["more_info_required", "rejected"].includes(application.status) && (
        <section className="panel-card" style={{ borderLeft: "4px solid var(--coral)" }}>
          <header><h2>Reviewer notes</h2></header>
          <div className="panel-body"><p style={{ margin: 0 }}>{application.reviewer_notes}</p></div>
        </section>
      )}

      {application.issued_record && (
        <section className="panel-card" style={{ borderLeft: "4px solid var(--green)" }}>
          <header><h2>Permit issued</h2></header>
          <div className="panel-body">
            <p style={{ marginTop: 0 }}>Your permit has been issued with the following reference.</p>
            <dl className="data-table" style={{ lineHeight: 1.9 }}>
              <div><dt style={{ color: "#667" }}>Permit number</dt><dd style={{ margin: 0, fontWeight: 700 }}>{application.issued_record.permit_number}</dd></div>
              <div><dt style={{ color: "#667" }}>Authority</dt><dd style={{ margin: 0 }}>{application.issued_record.authority}</dd></div>
              <div><dt style={{ color: "#667" }}>Valid from</dt><dd style={{ margin: 0 }}>{formatDate(application.issued_record.valid_from)}</dd></div>
              <div><dt style={{ color: "#667" }}>Valid to</dt><dd style={{ margin: 0 }}>{formatDate(application.issued_record.valid_to)}</dd></div>
            </dl>
            <div className="account-actions-row" style={{ marginTop: 16 }}>
              {certificateUrl && (
                <a className="primary-action" href={certificateUrl} target="_blank" rel="noopener">Download permit (PDF)</a>
              )}
              <Link className="secondary-action" href={`/verify/${application.issued_record.verification_token}`}>
                View online
              </Link>
            </div>
          </div>
        </section>
      )}

      {confirmationUrl && (
        <section className="panel-card">
          <header><h2>Application acknowledgement</h2></header>
          <div className="panel-body">
            <p style={{ marginTop: 0 }}>Download a PDF confirming all the details you submitted.</p>
            <a className="primary-action" href={confirmationUrl} target="_blank" rel="noopener">
              Download acknowledgement (PDF)
            </a>
          </div>
        </section>
      )}

      <section className="panel-card">
        <header><h2>Application details</h2></header>
        <div className="panel-body">
          <table className="data-table">
            <tbody>
              <tr><th>Reference</th><td>{application.reference}</td></tr>
              <tr><th>Permit</th><td>{application.permit?.name ?? "—"}</td></tr>
              <tr><th>Created</th><td>{formatDateTime(application.created_at)}</td></tr>
              <tr><th>Submitted</th><td>{application.submitted_at ? formatDateTime(application.submitted_at) : "Not submitted"}</td></tr>
              {Object.entries(form).map(([key, value]) => (
                <tr key={key}>
                  <th style={{ textTransform: "capitalize" }}>{key.replace(/_/g, " ")}</th>
                  <td>{typeof value === "boolean" ? (value ? "Yes" : "No") : String(value ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <header><h2>Documents</h2></header>
        <div className="panel-body">
          {documents.length === 0 ? (
            <p style={{ margin: 0, color: "#778" }}>No documents uploaded.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Document</th><th>File</th><th>Uploaded</th><th></th></tr></thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.document_type}</td>
                    <td>{doc.file_name ?? "—"}</td>
                    <td>{formatDateTime(doc.uploaded_at)}</td>
                    <td>{doc.url ? <a href={doc.url} target="_blank" rel="noopener">Download</a> : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-body">
          <ApplicationActions
            applicationId={application.id}
            slug={application.permit?.slug ?? ""}
            status={application.status}
          />
        </div>
      </section>
    </main>
  );
}
