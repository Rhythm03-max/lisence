import Link from "next/link";
import { redirect } from "next/navigation";
import { HomeSearch } from "@/components/HomeSearch";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; token_hash?: string; type?: string; error?: string; error_description?: string }>;
}) {
  // If Supabase falls back to the site root (e.g. the redirect URL is not on the
  // allow-list) it still appends the auth params here. Forward them to the
  // callback so the sign-in / password reset can complete.
  const params = await searchParams;
  if (params.code || params.token_hash || params.error) {
    const qs = new URLSearchParams();
    for (const key of ["code", "token_hash", "type", "error", "error_description"] as const) {
      const value = params[key];
      if (value) qs.set(key, value);
    }
    redirect(`/auth/callback?${qs.toString()}`);
  }

  return (
    <main id="main-content">
      <div className="home-stack site-width" id="home">
        <section className="welcome-panel" aria-labelledby="welcome-heading">
          <div className="mountains" aria-hidden="true">
            <span className="mountain m1"></span>
            <span className="mountain m2"></span>
            <span className="mountain m3"></span>
            <span className="mountain m4"></span>
          </div>
          <h1 id="welcome-heading">Welcome to the National Electronic Licensing System of Mauritius</h1>
          <Link className="apply-button" href="/licensing">Apply for Permit</Link>
          <HomeSearch />
        </section>

        <section className="banner-photo" aria-labelledby="banner-title">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/home-banner.png" alt="Port Louis waterfront illuminated at night" width={2048} height={681} />
          <h2 id="banner-title">Mauritius Business Licensing Platform</h2>
        </section>

        <section className="home-cards" id="licensing" aria-label="Licensing shortcuts">
          <Link className="home-card agencies" href="/licensing?view=agency">
            <h2>Agencies</h2>
            <p>Browse permits by agency</p>
          </Link>
          <Link className="home-card permits" href="/licensing">
            <h2>Permits</h2>
            <p>Browse permits by category</p>
          </Link>
          <Link className="home-card news" id="news" href="/news">
            <h2>News</h2>
            <p>Morcellement Board</p>
            <p>News &amp; Events</p>
          </Link>
          <Link className="home-card notices" id="notices" href="/faq-notices">
            <h2>Notices</h2>
            <p>Supported Browsers</p>
            <p className="strong">Protect your account <span>NEW</span></p>
          </Link>
        </section>
      </div>
    </main>
  );
}
