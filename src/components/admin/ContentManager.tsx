"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  createFaqAction,
  createNewsAction,
  deleteFaqAction,
  deleteNewsAction,
  toggleFaqActiveAction,
  toggleNewsActiveAction,
  updateFaqAction,
  updateNewsAction,
} from "@/lib/actions/content";
import { formatDate } from "@/lib/format";
import type { FaqItem, NewsItem } from "@/lib/types";

type Tab = "news" | "faqs";

export function ContentManager({ news, faqs }: { news: NewsItem[]; faqs: FaqItem[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("news");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function run(key: string, fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    setBusy(key);
    setError("");
    setStatus("");
    fn().then((result) => {
      setBusy("");
      if (!result.ok) setError(result.error ?? "Action failed.");
      else {
        setStatus(result.message ?? "Saved.");
        router.refresh();
      }
    });
  }

  function onCreateNews(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run("create-news", async () => {
      const result = await createNewsAction(data);
      if (result.ok) form.reset();
      return result;
    });
  }

  function onCreateFaq(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run("create-faq", async () => {
      const result = await createFaqAction(data);
      if (result.ok) form.reset();
      return result;
    });
  }

  function onUpdateNews(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(`news-${id}`, () => updateNewsAction(id, data));
  }

  function onUpdateFaq(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(`faq-${id}`, () => updateFaqAction(id, data));
  }

  return (
    <div>
      <div className="filter-chips" style={{ marginBottom: 18 }}>
        <button type="button" className={tab === "news" ? "active" : undefined} onClick={() => setTab("news")} style={{ cursor: "pointer" }}>News &amp; events ({news.length})</button>
        <button type="button" className={tab === "faqs" ? "active" : undefined} onClick={() => setTab("faqs")} style={{ cursor: "pointer" }}>FAQ &amp; notices ({faqs.length})</button>
      </div>

      <p className={`admin-form-status${error ? " error" : ""}`} aria-live="polite">{error || status}</p>

      {tab === "news" && (
        <>
          <section className="admin-panel">
            <div className="panel-heading"><div><span>＋</span><h2>New news item</h2></div></div>
            <form className="candidate-editor" onSubmit={onCreateNews} style={{ padding: 20 }}>
              <div className="admin-fields two-columns">
                <label className="full-field">Title<input name="title" required /></label>
                <label>Category
                  <select name="category" defaultValue="event">
                    <option value="event">Event</option>
                    <option value="morcellement">Morcellement Board</option>
                  </select>
                </label>
                <label className="full-field">Body<textarea name="body" rows={3} /></label>
              </div>
              <div className="admin-form-actions" style={{ marginTop: 14 }}>
                <button className="admin-primary" type="submit" disabled={busy === "create-news"}>{busy === "create-news" ? "Creating…" : "Create"}</button>
              </div>
            </form>
          </section>

          <section className="admin-panel" style={{ marginTop: 22 }}>
            <div className="panel-heading"><div><span>▤</span><h2>All news items</h2></div></div>
            {news.length === 0 && <div className="records-empty"><strong>No news items</strong><span>Create one above.</span></div>}
            {news.map((item) => (
              <form key={item.id} className="candidate-editor" onSubmit={(e) => onUpdateNews(e, item.id)} style={{ padding: 20, borderTop: "1px solid #edf1f4" }}>
                <div className="admin-fields two-columns">
                  <label className="full-field">Title<input name="title" defaultValue={item.title} required /></label>
                  <label>Category
                    <select name="category" defaultValue={item.category}>
                      <option value="event">Event</option>
                      <option value="morcellement">Morcellement Board</option>
                    </select>
                  </label>
                  <label className="full-field">Body<textarea name="body" rows={2} defaultValue={item.body ?? ""} /></label>
                </div>
                <div className="admin-form-actions" style={{ marginTop: 12, justifyContent: "flex-start", flexWrap: "wrap" }}>
                  <button className="admin-primary" type="submit" disabled={busy === `news-${item.id}`}>{busy === `news-${item.id}` ? "Saving…" : "Save"}</button>
                  <button type="button" className="admin-secondary" disabled={busy === `news-${item.id}`} onClick={() => run(`news-${item.id}`, () => toggleNewsActiveAction(item.id, !item.is_active))}>
                    {item.is_active ? "Unpublish" : "Publish"}
                  </button>
                  <button type="button" className="admin-secondary" disabled={busy === `news-${item.id}`} onClick={() => { if (window.confirm("Delete this news item?")) run(`news-${item.id}`, () => deleteNewsAction(item.id)); }}>Delete</button>
                  <span className={`status-pill ${item.is_active ? "approved" : "draft"}`} style={{ alignSelf: "center" }}>{item.is_active ? "Published" : "Draft"} · {formatDate(item.published_at.slice(0, 10))}</span>
                </div>
              </form>
            ))}
          </section>
        </>
      )}

      {tab === "faqs" && (
        <>
          <section className="admin-panel">
            <div className="panel-heading"><div><span>＋</span><h2>New entry</h2></div></div>
            <form className="candidate-editor" onSubmit={onCreateFaq} style={{ padding: 20 }}>
              <div className="admin-fields two-columns">
                <label className="full-field">Question / heading<input name="question" required /></label>
                <label className="full-field">Answer / body<textarea name="answer" rows={3} required /></label>
                <label>Type
                  <select name="type" defaultValue="faq">
                    <option value="faq">FAQ</option>
                    <option value="did_you_know">Did You Know</option>
                    <option value="notice">Notice</option>
                  </select>
                </label>
                <label>Sort order<input name="sort_order" type="number" defaultValue={0} /></label>
              </div>
              <div className="admin-form-actions" style={{ marginTop: 14 }}>
                <button className="admin-primary" type="submit" disabled={busy === "create-faq"}>{busy === "create-faq" ? "Creating…" : "Create"}</button>
              </div>
            </form>
          </section>

          <section className="admin-panel" style={{ marginTop: 22 }}>
            <div className="panel-heading"><div><span>▤</span><h2>All entries</h2></div></div>
            {faqs.length === 0 && <div className="records-empty"><strong>No entries</strong><span>Create one above.</span></div>}
            {faqs.map((item) => (
              <form key={item.id} className="candidate-editor" onSubmit={(e) => onUpdateFaq(e, item.id)} style={{ padding: 20, borderTop: "1px solid #edf1f4" }}>
                <div className="admin-fields two-columns">
                  <label className="full-field">Question / heading<input name="question" defaultValue={item.question} required /></label>
                  <label className="full-field">Answer / body<textarea name="answer" rows={2} defaultValue={item.answer} required /></label>
                  <label>Type
                    <select name="type" defaultValue={item.type}>
                      <option value="faq">FAQ</option>
                      <option value="did_you_know">Did You Know</option>
                      <option value="notice">Notice</option>
                    </select>
                  </label>
                  <label>Sort order<input name="sort_order" type="number" defaultValue={item.sort_order} /></label>
                </div>
                <div className="admin-form-actions" style={{ marginTop: 12, justifyContent: "flex-start", flexWrap: "wrap" }}>
                  <button className="admin-primary" type="submit" disabled={busy === `faq-${item.id}`}>{busy === `faq-${item.id}` ? "Saving…" : "Save"}</button>
                  <button type="button" className="admin-secondary" disabled={busy === `faq-${item.id}`} onClick={() => run(`faq-${item.id}`, () => toggleFaqActiveAction(item.id, !item.is_active))}>
                    {item.is_active ? "Disable" : "Enable"}
                  </button>
                  <button type="button" className="admin-secondary" disabled={busy === `faq-${item.id}`} onClick={() => { if (window.confirm("Delete this entry?")) run(`faq-${item.id}`, () => deleteFaqAction(item.id)); }}>Delete</button>
                </div>
              </form>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
