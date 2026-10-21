import type { Metadata } from "next";
import { PublicPermitSearch } from "@/components/PublicPermitSearch";

export const metadata: Metadata = {
  title: "Search Permits",
  description: "Search and verify permits issued in Mauritius.",
};

export default async function SearchPermitsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; permitNumber?: string }>;
}) {
  const { q, permitNumber } = await searchParams;
  return (
    <main className="permit-search-main site-width" id="main-content">
      <PublicPermitSearch initialQuery={permitNumber ?? q ?? ""} autoSearch={Boolean(permitNumber)} />
    </main>
  );
}
