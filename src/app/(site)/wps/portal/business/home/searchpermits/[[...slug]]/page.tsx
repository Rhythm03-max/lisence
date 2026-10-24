import type { Metadata } from "next";
import { PublicPermitSearch } from "@/components/PublicPermitSearch";

export const metadata: Metadata = {
  title: { absolute: "Search Permits" },
  description: "Search and verify permits issued in Mauritius.",
};

/**
 * Mirrors the reference platform's directory-style public URL:
 *   /wps/portal/business/home/searchpermits/#/publicsearch/wp/<permitNumber>
 * The path segments before the hash are ignored; the record is resolved from
 * the hash fragment on the client (see PublicPermitSearch `readHash`).
 */
export default function SearchPermitsPortalPage() {
  return (
    <main className="permit-search-main site-width" id="main-content">
      <PublicPermitSearch readHash />
    </main>
  );
}
