import type { Metadata } from "next";
import { LicensingCatalog } from "@/components/LicensingCatalog";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = {
  title: "Licensing",
  description: "Browse Mauritius business permits by category or agency.",
};

export default async function LicensingPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string }>;
}) {
  const { view, q } = await searchParams;
  const { categories, agencies } = await getCatalog();

  return (
    <main className="licensing-main site-width" id="main-content">
      <LicensingCatalog
        categories={categories}
        agencies={agencies}
        initialView={view === "agency" ? "agency" : "category"}
        query={q ?? ""}
      />
    </main>
  );
}
