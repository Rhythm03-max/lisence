import type { Metadata } from "next";
import { PublicPermitSearch } from "@/components/PublicPermitSearch";

export const metadata: Metadata = {
  title: "Search Permits",
  description: "Search and verify permits issued in Mauritius.",
};

export default function SearchPermitsPortletPage() {
  return (
    <main className="permit-search-main site-width" id="main-content">
      <PublicPermitSearch readHash />
    </main>
  );
}
