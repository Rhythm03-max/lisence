import type { Metadata } from "next";
import Link from "next/link";
import { listPermitRecords } from "@/lib/admin-data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Permit Records" };

const STATUSES = ["Active", "Pending", "Expired", "Cancelled"];

export default async function AdminRecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const records = await listPermitRecords();

  const query = (q ?? "").trim().toLowerCase();
  const filtered = records.filter((record) => {
    if (status && record.status !== status) return false;
    if (!query) return true;
    return [record.permit_number, record.surname, record.first_name, record.employer, record.authority]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <>
      <section className="admin-intro">
        <div>
          <p className="admin-eyebrow">PERMIT DIRECTORY</p>
          <h2>Permit records</h2>
          <p>Search, edit and manage issued permit records.</p>
        </div>
        <div className="record-total"><strong>{records.length}</strong><span>Records</span></div>
      </section>

      <div className="admin-toolbar">
        <div className="filter-chips">
          <Link href="/admin/records" className={!status ? "active" : undefined}>All</Link>
          {STATUSES.map((s) => (
            <Link key={s} href={`/admin/records?status=${s}`} className={status === s ? "active" : undefined}>{s}</Link>
          ))}
        </div>
        <form method="get" action="/admin/records" className="record-search">
          {status && <input type="hidden" name="status" value={status} />}
          <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search permit or candidate" aria-label="Search records" />
        </form>
      </div>

      <section className="admin-panel">
        <div className="panel-heading">
          <div><span>01</span><h2>Records</h2></div>
          <Link className="admin-link-button" href="/admin/records/new">+ Add record</Link>
        </div>
        {filtered.length === 0 ? (
          <div className="records-empty">
            <strong>No records found</strong>
            <span>{records.length === 0 ? "Create the first permit record." : "Try a different search or filter."}</span>
          </div>
        ) : (
          <div className="records-table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Candidate</th><th>Permit number</th><th>Employer</th><th>Validity</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((record) => (
                  <tr key={record.id}>
                    <td>{record.surname} {record.first_name}{record.nationality ? ` · ${record.nationality}` : ""}</td>
                    <td>{record.permit_number}</td>
                    <td>{record.employer ?? "—"}</td>
                    <td>{formatDate(record.valid_from)} – {formatDate(record.valid_to)}</td>
                    <td><span className={`status-pill ${record.status === "Active" ? "approved" : record.status === "Pending" ? "under_review" : "rejected"}`}>{record.status}</span></td>
                    <td><Link href={`/admin/records/${record.id}`}>Edit</Link></td>
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
