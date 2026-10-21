import type { Metadata } from "next";
import Link from "next/link";
import { getAdminStats, listApplications, listPermitRecords } from "@/lib/admin-data";
import { APPLICATION_STATUS_LABELS, formatDate, statusClass } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminHomePage() {
  const [stats, applications, records] = await Promise.all([
    getAdminStats(),
    listApplications(),
    listPermitRecords(),
  ]);

  const pending = applications.filter((a) =>
    ["submitted", "under_review", "more_info_required"].includes(a.status),
  );

  return (
    <>
      <section className="admin-intro">
        <div>
          <p className="admin-eyebrow">OVERVIEW</p>
          <h2>Dashboard</h2>
          <p>Monitor permit records, applications and users.</p>
        </div>
        <div className="record-total">
          <strong>{stats?.total_records ?? records.length}</strong>
          <span>Active permit records</span>
        </div>
      </section>

      <div className="admin-stat-grid">
        <div className="stat-tile"><strong>{stats?.active_records ?? 0}</strong><span>Active records</span></div>
        <div className="stat-tile"><strong>{stats?.expiring_soon ?? 0}</strong><span>Expiring in 60 days</span></div>
        <div className="stat-tile"><strong>{stats?.pending_apps ?? 0}</strong><span>Applications in process</span></div>
        <div className="stat-tile"><strong>{stats?.total_applicants ?? 0}</strong><span>Applicants</span></div>
      </div>

      <section className="admin-panel" style={{ marginTop: 22 }}>
        <div className="panel-heading">
          <div><span>01</span><h2>Applications requiring attention</h2></div>
          <Link className="admin-link-button" href="/admin/applications">View all</Link>
        </div>
        {pending.length === 0 ? (
          <div className="records-empty"><strong>No pending applications</strong><span>New submissions will appear here.</span></div>
        ) : (
          <div className="records-table-wrap">
            <table className="data-table">
              <thead><tr><th>Reference</th><th>Applicant</th><th>Permit</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
              <tbody>
                {pending.slice(0, 6).map((application) => (
                  <tr key={application.id}>
                    <td>{application.reference}</td>
                    <td>{[application.applicant?.first_name, application.applicant?.last_name].filter(Boolean).join(" ") || "—"}</td>
                    <td>{application.permit?.name ?? "—"}</td>
                    <td><span className={`status-pill ${statusClass(application.status)}`}>{APPLICATION_STATUS_LABELS[application.status]}</span></td>
                    <td>{application.submitted_at ? formatDate(application.submitted_at.slice(0, 10)) : "—"}</td>
                    <td><Link href={`/admin/applications/${application.id}`}>Review</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-panel" style={{ marginTop: 22 }}>
        <div className="panel-heading">
          <div><span>02</span><h2>Recently created records</h2></div>
          <Link className="admin-link-button" href="/admin/records/new">Add record</Link>
        </div>
        {records.length === 0 ? (
          <div className="records-empty"><strong>No permit records</strong><span>Create the first record.</span></div>
        ) : (
          <div className="records-table-wrap">
            <table className="data-table">
              <thead><tr><th>Holder</th><th>Permit number</th><th>Authority</th><th>Validity</th><th></th></tr></thead>
              <tbody>
                {records.slice(0, 6).map((record) => (
                  <tr key={record.id}>
                    <td>{record.surname} {record.first_name}</td>
                    <td>{record.permit_number}</td>
                    <td>{record.authority}</td>
                    <td>{formatDate(record.valid_from)} – {formatDate(record.valid_to)}</td>
                    <td><Link href={`/admin/records/${record.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
