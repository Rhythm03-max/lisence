import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPermitBySlug } from "@/lib/data";
import { getMyApplication } from "@/lib/portal";
import { ApplicationWizard } from "@/components/portal/ApplicationWizard";

export const metadata: Metadata = { title: "Apply for a permit" };

export default async function ApplyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ application?: string }>;
}) {
  const { slug } = await params;
  const { application: requestedId } = await searchParams;
  const profile = await requireUser(`/apply/${slug}`);

  const permit = await getPermitBySlug(slug);
  if (!permit) notFound();

  let applicationId = requestedId;
  let initialFormData: Record<string, unknown> | undefined;
  if (requestedId) {
    const existing = await getMyApplication(requestedId, profile.id);
    if (existing && existing.permit_id === permit.id && ["draft", "more_info_required"].includes(existing.status)) {
      initialFormData = existing.form_data;
    } else {
      applicationId = undefined;
    }
  }

  return (
    <main className="portal-main site-width" id="main-content">
      <div className="portal-toolbar">
        <div>
          <p style={{ margin: 0 }}><Link href={`/permits/${permit.slug}`}>← Back to permit</Link></p>
          <h1>Apply: {permit.name}</h1>
          <p>Complete the steps below to submit your application.</p>
        </div>
      </div>
      <ApplicationWizard
        permit={permit}
        profile={profile}
        existingApplicationId={applicationId}
        initialFormData={initialFormData}
      />
    </main>
  );
}
