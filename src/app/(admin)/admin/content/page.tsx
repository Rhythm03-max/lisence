import type { Metadata } from "next";
import { listFaqsAdmin, listNewsAdmin } from "@/lib/admin-data";
import { ContentManager } from "@/components/admin/ContentManager";

export const metadata: Metadata = { title: "Content" };

export default async function AdminContentPage() {
  const [news, faqs] = await Promise.all([listNewsAdmin(), listFaqsAdmin()]);

  return (
    <>
      <section className="admin-intro">
        <div>
          <p className="admin-eyebrow">CONTENT</p>
          <h2>Content management</h2>
          <p>Publish news, notices and frequently asked questions.</p>
        </div>
      </section>

      <ContentManager news={news} faqs={faqs} />
    </>
  );
}
