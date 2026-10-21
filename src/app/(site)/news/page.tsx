import type { Metadata } from "next";
import { getNews } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "News",
  description: "News and events from the Mauritius Business Licensing Platform.",
};

export default async function NewsPage() {
  const news = await getNews();

  return (
    <main className="simple-main site-width" id="main-content">
      {news.filter((n) => n.category === "morcellement").map((item) => (
        <section key={item.id}>
          <h1>{item.title}</h1>
          <p>{item.body}</p>
          <p><a href={`/news#${item.slug}`}>Read More</a></p>
        </section>
      ))}

      <section>
        <h1>News &amp; Events</h1>
        {news.filter((n) => n.category === "event").length === 0 && (
          <p>No news items at this time.</p>
        )}
        {news
          .filter((n) => n.category === "event")
          .map((item) => (
            <article key={item.id} id={item.slug} style={{ marginBottom: 18 }}>
              <h2 style={{ fontSize: 17, marginBottom: 4 }}>{item.title}</h2>
              <p style={{ color: "#777", fontSize: 12, margin: "0 0 4px" }}>
                {formatDate(item.published_at.slice(0, 10))}
              </p>
              <p style={{ margin: 0 }}>{item.body}</p>
            </article>
          ))}
      </section>

      <nav className="pagination" aria-label="News pages">
        <a href="#first">First</a>
        <a href="#previous">Previous</a>
        <span aria-current="page">1</span>
        <a href="#next">Next</a>
        <a href="#last">Last</a>
      </nav>
    </main>
  );
}
