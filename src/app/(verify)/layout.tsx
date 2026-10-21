import type { Metadata } from "next";
import "@/app/globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCurrentProfile } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verify Permit | Mauritius Business Licensing Platform",
  description: "Verify the authenticity of a permit issued through the National Electronic Licensing System.",
  icons: { icon: "/assets/images/favicon.png" },
};

export default async function VerifyLayout({ children }: { children: React.ReactNode }) {
  let profile: Profile | null = null;
  try {
    profile = await getCurrentProfile();
  } catch {
    profile = null;
  }

  return (
    <html lang="en">
      <body data-page="verify">
        <SiteHeader profile={profile} />
        {children}
        <SiteFooter verify />
      </body>
    </html>
  );
}
