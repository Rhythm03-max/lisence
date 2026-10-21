"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/types";

type View = "faqs" | "know" | "notices";

const TABS: { key: View; label: string }[] = [
  { key: "faqs", label: "FAQs" },
  { key: "know", label: "Did You Know" },
  { key: "notices", label: "Notices" },
];

function Accordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const isOpen = (id: string, index: number) => open.has(id) || (open.size === 0 && index < 4);

  return (
    <div className="faq-accordion">
      {items.map((item, index) => {
        const expanded = isOpen(item.id, index);
        return (
          <article className="faq-item" key={item.id}>
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() =>
                setOpen((prev) => {
                  const next = new Set(prev);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                })
              }
            >
              {item.question}
              <span aria-hidden="true"></span>
            </button>
            {expanded && <div className="faq-answer">{item.answer}</div>}
          </article>
        );
      })}
    </div>
  );
}

export function FaqNotices({ faqs, know, notices }: { faqs: FaqItem[]; know: FaqItem[]; notices: FaqItem[] }) {
  const [view, setView] = useState<View>("faqs");

  return (
    <>
      <div className="faq-toolbar">
        <div className="faq-tabs" role="tablist" aria-label="FAQ content">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={view === tab.key}
              onClick={() => setView(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <a href="mailto:nels@edbmauritius.org">Request NELS Helpdesk Support</a>
      </div>

      <div id="faq-content">
        {view === "faqs" && (
          <section className="faq-section">
            <h1>Morcellement Permit</h1>
            <Accordion items={faqs} />
          </section>
        )}
        {view === "know" && (
          <section className="faq-section">
            <h1>Morcellement Permit</h1>
            <Accordion items={know} />
          </section>
        )}
        {view === "notices" && (
          <section className="notice-list">
            <h1>Notices</h1>
            <p>Important announcements from the licensing platform.</p>
            {notices.map((notice) => (
              <article key={notice.id} style={{ marginBottom: 22 }}>
                <h2 style={{ fontSize: 16 }}>{notice.question}</h2>
                <p style={{ margin: 0 }}>{notice.answer}</p>
              </article>
            ))}
            {notices.length === 0 && <p>No notices at this time.</p>}
          </section>
        )}
      </div>
    </>
  );
}
