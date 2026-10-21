import type { Metadata } from "next";
import "@/app/globals.css";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration | Mauritius Business Licensing Platform",
  robots: { index: false, follow: false },
  icons: { icon: "/assets/images/favicon.png" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return (
    <html lang="en">
      <body className="admin-body">
        <AdminShell profile={profile}>{children}</AdminShell>
      </body>
    </html>
  );
}
