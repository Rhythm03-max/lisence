import type { Metadata } from "next";
import { FaqNotices } from "@/components/FaqNotices";
import { getFaqs } from "@/lib/data";

export const metadata: Metadata = {
  title: "FAQ's & Notices",
  description: "Frequently asked questions, notices and guidance for the licensing platform.",
};

export default async function FaqNoticesPage() {
  const [faqs, know, notices] = await Promise.all([
    getFaqs("faq"),
    getFaqs("did_you_know"),
    getFaqs("notice"),
  ]);

  return (
    <main className="faq-main site-width" id="main-content">
      <FaqNotices faqs={faqs} know={know} notices={notices} />
    </main>
  );
}
