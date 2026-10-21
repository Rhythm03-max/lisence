import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getMyApplications } from "@/lib/portal";
import { APPLICATION_STATUS_LABELS, formatDate, statusClass } from "@/lib/format";

export const metadata: Metadata = { title: "My Dashboard" };

export default async function DashboardPage() {
  const profile = await requireUser("/dashboard");
  const applications = await getMyApplications(profile.id);

  const total = applications.length;
  const drafts = applications.filter((a) => a.status === "draft").length;
  const inProgress = applications.filter((a) =>
    ["submitted", "under_review", "more_info_required"].includes(a.status),
  ).length;
  const approved = applications.filter((a) => a.status === "approved").length;

  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email;

  return (
    <main className="portal-main site-width" id="main-content">
      <div className="portal-toolbar">
        <div>
          <h1>Welcome, {name}</h1>
          <p>Manage your permit applications and account details.</p>
        </div>
        <Link className="primary-action" href="/licensing">Start a new application</Link>
      </div>

      <div className="portal-grid">
        <div className="stat-tile"><strong>{total}</strong><span>Total applications</span></div>
        <div className="stat-tile"><strong>{drafts}</strong><span>Drafts in progress</span></div>
        <div className="stat-tile"><strong>{inProgress}</strong><span>Under processing</span></div>
        <div className="stat-tile"><strong>{approved}</strong><span>Approved</span></div>
      </div>

      <section className="panel-card">
        <header>
          <h2>My applications</h2>
          <Link href="/applications">View all</Link>
        </header>
        {applications.length === 0 ? (
          <div className="empty-state">
            <p>You have no applications yet.</p>
            <Link className="secondary-action" href="/licensing">Browse licensing services</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Reference</th><th>Permit</th><th>Status</th><th>Last updated</th><th></th></tr>
            </thead>
            <tbody>
              {applications.slice(0, 6).map((application) => (
                <tr key={application.id}>
                  <td>{application.reference}</td>
                  <td>{application.permit?.name ?? "—"}</td>
                  <td><span className={`status-pill ${statusClass(application.status)}`}>{APPLICATION_STATUS_LABELS[application.status] ?? application.status}</span></td>
                  <td>{formatDate(application.updated_at.slice(0, 10))}</td>
                  <td><Link href={`/applications/${application.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel-card">
        <header><h2>Account</h2></header>
        <div className="panel-body">
          <p style={{ marginTop: 0 }}>Keep your profile up to date. Complete your personal details so your applications can be processed without delay.</p>
          <Link className="secondary-action" href="/profile">Edit my profile</Link>
        </div>
      </section>
    </main>
  );
}
