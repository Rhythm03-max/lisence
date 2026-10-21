import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyApplications } from "@/lib/portal";
import { APPLICATION_STATUS_LABELS, formatDate, statusClass } from "@/lib/format";

export const metadata: Metadata = { title: "My Applications" };

export default async function ApplicationsPage() {
  const profile = await requireUser("/applications");
  const applications = await getMyApplications(profile.id);

  return (
    <main className="portal-main site-width" id="main-content">
      <div className="portal-toolbar">
        <div>
          <h1>My applications</h1>
          <p>Track the progress of your permit applications.</p>
        </div>
        <Link className="primary-action" href="/licensing">New application</Link>
      </div>

      <section className="panel-card">
        {applications.length === 0 ? (
          <div className="empty-state">
            <p>You have not started any application yet.</p>
            <Link className="secondary-action" href="/licensing">Browse licensing services</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Reference</th><th>Permit</th><th>Status</th><th>Submitted</th><th>Last updated</th><th></th></tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>{application.reference}</td>
                  <td>{application.permit?.name ?? "—"}</td>
                  <td><span className={`status-pill ${statusClass(application.status)}`}>{APPLICATION_STATUS_LABELS[application.status] ?? application.status}</span></td>
                  <td>{application.submitted_at ? formatDate(application.submitted_at.slice(0, 10)) : "—"}</td>
                  <td>{formatDate(application.updated_at.slice(0, 10))}</td>
                  <td><Link href={`/applications/${application.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
