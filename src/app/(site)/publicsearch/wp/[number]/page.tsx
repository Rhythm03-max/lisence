import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PublicPermitCard } from "@/components/PermitCard";
import type { PublicPermit } from "@/lib/types";

export const dynamic = "force-dynamic";

async function fetchPermit(permitNumber: string): Promise<PublicPermit | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("search_public_permit", {
      p_permit_number: permitNumber,
      p_issued_date: null,
      p_holder: null,
    });
    if (error || !data) return null;
    return data as PublicPermit;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const permitNumber = decodeURIComponent(number);
  return {
    title: `Permit ${permitNumber}`,
    description: `Public permit record for ${permitNumber}.`,
  };
}

export default async function PublicPermitRecordPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const permitNumber = decodeURIComponent(number);
  const permit = await fetchPermit(permitNumber);

  return (
    <main className="permit-search-main site-width" id="main-content">
      <h1>Public permit record</h1>
      {permit ? (
        <section className="permit-search-results showing">
          <PublicPermitCard permit={permit} />
        </section>
      ) : (
        <article className="verify-not-found">
          <div className="not-found-icon">!</div>
          <h2>Permit not found</h2>
          <p>
            No public permit record matches <strong>{permitNumber}</strong>. Check the permit number
            and try again.
          </p>
          <Link href="/search-permits" className="primary-action">Search a permit</Link>
        </article>
      )}
    </main>
  );
}
