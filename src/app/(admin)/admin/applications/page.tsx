import type { Metadata } from "next";
import Link from "next/link";
import { listApplications } from "@/lib/admin-data";
import { APPLICATION_STATUS_LABELS, formatDate, statusClass } from "@/lib/format";

export const metadata: Metadata = { title: "Applications" };

const FILTERS = [
  { key: "", label: "All" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under review" },
  { key: "more_info_required", label: "More info" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const applications = await listApplications();
  const filtered = status ? applications.filter((a) => a.status === status) : applications;

  return (
    <>
      <section className="admin-intro">
        <div>
          <p className="admin-eyebrow">APPLICATIONS</p>
          <h2>Applications</h2>
          <p>Review and process submitted permit applications.</p>
        </div>
        <div className="record-total"><strong>{applications.length}</strong><span>Total applications</span></div>
      </section>

      <div className="admin-toolbar">
        <div className="filter-chips">
          {FILTERS.map((filter) => (
            <Link
              key={filter.key || "all"}
              href={filter.key ? `/admin/applications?status=${filter.key}` : "/admin/applications"}
              className={status === filter.key || (!status && !filter.key) ? "active" : undefined}
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="admin-panel">
        {filtered.length === 0 ? (
          <div className="records-empty"><strong>No applications</strong><span>Applications will appear here once submitted.</span></div>
        ) : (
          <div className="records-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Reference</th><th>Applicant</th><th>Permit</th><th>Status</th><th>Submitted</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((application) => (
                  <tr key={application.id}>
                    <td>{application.reference}</td>
                    <td>{[application.applicant?.first_name, application.applicant?.last_name].filter(Boolean).join(" ") || application.applicant?.email || "—"}</td>
                    <td>{application.permit?.name ?? "—"}</td>
                    <td><span className={`status-pill ${statusClass(application.status)}`}>{APPLICATION_STATUS_LABELS[application.status] ?? application.status}</span></td>
                    <td>{application.submitted_at ? formatDate(application.submitted_at.slice(0, 10)) : "—"}</td>
                    <td><Link href={`/admin/applications/${application.id}`}>Review</Link></td>
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
