import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPermitRecord, listPermitsForSelect } from "@/lib/admin-data";
import { publicPhotoUrl } from "@/lib/storage";
import { getSiteUrl } from "@/lib/site-url";
import { permitPublicUrl } from "@/lib/permalink";
import { RecordForm } from "@/components/admin/RecordForm";
import { RecordSidePanel } from "@/components/admin/RecordSidePanel";

export const metadata: Metadata = { title: "Edit permit record" };

export default async function RecordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [record, permits, siteUrl] = await Promise.all([
    getPermitRecord(id),
    listPermitsForSelect(),
    getSiteUrl(),
  ]);
  if (!record) notFound();

  const photoUrl = publicPhotoUrl(record.photo_path);
  const verificationUrl = `${siteUrl}/verify/${record.verification_token}`;
  const publicUrl = permitPublicUrl(siteUrl, record.permit_number);

  return (
    <>
      <section className="admin-intro">
        <div>
          <p className="admin-eyebrow">PERMIT RECORD</p>
          <h2>{record.surname} {record.first_name}</h2>
          <p>{record.permit_number} · {record.status}</p>
        </div>
        <Link className="admin-link-button" href="/admin/records">← Back to records</Link>
      </section>

      <RecordSidePanel record={record} photoUrl={photoUrl} verificationUrl={verificationUrl} publicUrl={publicUrl}>
        <div className="admin-panel candidate-editor">
          <div className="panel-heading"><div><span>01</span><h2>Record details</h2></div></div>
          <RecordForm permits={permits} record={record} />
        </div>
      </RecordSidePanel>
    </>
  );
}
