import type { Metadata } from "next";
import Link from "next/link";
import { listPermitsForSelect } from "@/lib/admin-data";
import { RecordForm } from "@/components/admin/RecordForm";

export const metadata: Metadata = { title: "Add permit record" };

export default async function NewRecordPage() {
  const permits = await listPermitsForSelect();

  return (
    <>
      <section className="admin-intro">
        <div>
          <p className="admin-eyebrow">NEW RECORD</p>
          <h2>Add permit record</h2>
          <p>Create a new permit record. A verification token and QR code are generated automatically.</p>
        </div>
        <Link className="admin-link-button" href="/admin/records">← Back to records</Link>
      </section>

      <section className="admin-panel candidate-editor">
        <div className="panel-heading"><div><span>01</span><h2>Record details</h2></div></div>
        <RecordForm permits={permits} />
      </section>
    </>
  );
}
