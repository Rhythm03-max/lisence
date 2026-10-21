import type { Metadata } from "next";
import "@/app/globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentProfile } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Mauritius Business Licensing Platform",
    template: "%s | Mauritius Business Licensing Platform",
  },
  description: "Apply, search and verify business permits and licences in Mauritius.",
  icons: { icon: "/assets/images/favicon.png" },
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile | null = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <SiteHeader profile={profile} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
