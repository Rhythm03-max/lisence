import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { publicPhotoUrl } from "@/lib/storage";
import { VerifyCard } from "@/components/PermitCard";
import type { VerifiedPermit } from "@/lib/types";

export const metadata: Metadata = {
  title: "Official Permit Verification",
  robots: { index: false, follow: false },
};

async function verifyToken(token: string): Promise<VerifiedPermit | null> {
  if (!/^v1_[A-Za-z0-9_-]{43}$/.test(token)) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_permit_by_token", { p_token: token });
    if (error || !data) return null;
    return data as VerifiedPermit;
  } catch {
    return null;
  }
}

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const permit = await verifyToken(token);

  return (
    <main className="verify-main" id="main-content">
      <section className="site-width verify-stage" aria-live="polite">
        {permit ? (
          <VerifyCard permit={permit} photoUrl={publicPhotoUrl(permit.photo_path)} />
        ) : (
          <article className="verify-not-found">
            <div className="not-found-icon">!</div>
            <h2>Verification not found</h2>
            <p>The link is invalid, expired, revoked, or the record is not publicly available. Check the QR code and try again.</p>
            <Link href="/search-permits" className="primary-action">Search a permit</Link>
          </article>
        )}
      </section>
    </main>
  );
}
