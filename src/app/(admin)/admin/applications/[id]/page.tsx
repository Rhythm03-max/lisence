import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplication } from "@/lib/admin-data";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_STATUS_LABELS, formatDate, formatDateTime, statusClass } from "@/lib/format";
import { ReviewForm } from "@/components/admin/ReviewForm";

export const metadata: Metadata = { title: "Application review" };

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplication(id);
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
  const applicant = application.applicant;

  return (
    <>
      <section className="admin-intro">
        <div>
          <p className="admin-eyebrow">APPLICATION</p>
          <h2>{application.reference}</h2>
          <p>{application.permit?.name ?? "Permit"}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className={`status-pill ${statusClass(application.status)}`}>{APPLICATION_STATUS_LABELS[application.status] ?? application.status}</span>
          <p style={{ margin: "8px 0 0" }}><Link className="admin-link-button" href="/admin/applications">← All applications</Link></p>
        </div>
      </section>

      <div className="record-detail-grid">
        <div>
          <section className="admin-panel">
            <div className="panel-heading"><div><span>01</span><h2>Applicant</h2></div></div>
            <div style={{ padding: 20 }}>
              <table className="data-table">
                <tbody>
                  <tr><th style={{ width: 180 }}>Name</th><td>{[applicant?.first_name, applicant?.last_name].filter(Boolean).join(" ") || "—"}</td></tr>
                  <tr><th>Email</th><td>{applicant?.email ?? "—"}</td></tr>
                  <tr><th>Mobile</th><td>{applicant?.mobile ?? "—"}</td></tr>
                  <tr><th>Nationality</th><td>{applicant?.nationality ?? "—"}</td></tr>
                  <tr><th>Passport</th><td>{applicant?.passport_number ?? "—"}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="admin-panel" style={{ marginTop: 22 }}>
            <div className="panel-heading"><div><span>02</span><h2>Application form</h2></div></div>
            <div style={{ padding: 20 }}>
              <table className="data-table">
                <tbody>
                  <tr><th style={{ width: 180 }}>Created</th><td>{formatDateTime(application.created_at)}</td></tr>
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

          <section className="admin-panel" style={{ marginTop: 22 }}>
            <div className="panel-heading"><div><span>03</span><h2>Documents</h2></div></div>
            <div style={{ padding: 20 }}>
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

          {application.issued_record && (
            <section className="admin-panel" style={{ marginTop: 22 }}>
              <div className="panel-heading"><div><span>04</span><h2>Issued permit</h2></div></div>
              <div style={{ padding: 20 }}>
                <table className="data-table">
                  <tbody>
                    <tr><th style={{ width: 180 }}>Permit number</th><td>{application.issued_record.permit_number}</td></tr>
                    <tr><th>Authority</th><td>{application.issued_record.authority}</td></tr>
                    <tr><th>Valid from</th><td>{formatDate(application.issued_record.valid_from)}</td></tr>
                    <tr><th>Valid to</th><td>{formatDate(application.issued_record.valid_to)}</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <aside>
          <section className="admin-panel">
            <div className="panel-heading"><div><span>★</span><h2>Decision</h2></div></div>
            <div style={{ padding: 20 }}>
              {application.reviewer_notes && (
                <p style={{ marginTop: 0, padding: 12, background: "#f7fafb", border: "1px solid #dbe3e9", borderRadius: 4, fontSize: 12 }}>
                  <strong>Current notes:</strong> {application.reviewer_notes}
                </p>
              )}
              {["approved", "rejected", "cancelled"].includes(application.status) ? (
                <p className="admin-form-status">This application has been finalised ({APPLICATION_STATUS_LABELS[application.status]}).</p>
              ) : (
                <ReviewForm applicationId={application.id} />
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
