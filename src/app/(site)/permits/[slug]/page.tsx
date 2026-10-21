import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPermitBySlug } from "@/lib/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const permit = await getPermitBySlug(slug);
  return { title: permit ? permit.name : "Permit" };
}

export default async function PermitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const permit = await getPermitBySlug(slug);
  if (!permit) notFound();

  const steps = permit.steps ?? [];
  const documents = permit.required_documents ?? [];
  const links = permit.legislation_links ?? [];

  return (
    <main className="simple-main site-width" id="main-content">
      <nav aria-label="Breadcrumb" style={{ marginBottom: 16 }}>
        <Link href="/licensing" style={{ color: "#0870bc" }}>Licensing</Link>
        <span style={{ color: "#999" }}> / {permit.name}</span>
      </nav>

      <section>
        <p className="admin-eyebrow" style={{ color: "#0870bc" }}>PERMIT</p>
        <h1 style={{ fontSize: 30 }}>{permit.name}</h1>
        {permit.description && <p style={{ maxWidth: 760 }}>{permit.description}</p>}
        <p style={{ marginTop: 14 }}>
          <Link className="primary-action" href={`/apply/${permit.slug}`}>Apply for this permit</Link>
        </p>
      </section>

      {steps.length > 0 && (
        <section>
          <h2 style={{ fontSize: 20 }}>Application steps</h2>
          <ol style={{ paddingLeft: 20, lineHeight: 1.6, maxWidth: 760 }}>
            {steps.map((step, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <strong>{step.title}</strong>
                {step.description ? <div style={{ color: "#555" }}>{step.description}</div> : null}
              </li>
            ))}
          </ol>
        </section>
      )}

      {documents.length > 0 && (
        <section>
          <h2 style={{ fontSize: 20 }}>Required documents</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6, maxWidth: 760 }}>
            {documents.map((doc, i) => (
              <li key={i} style={{ marginBottom: 6 }}>
                {doc.label}
                {doc.required ? <span style={{ color: "#b43838" }}> *</span> : <span style={{ color: "#777" }}> (optional)</span>}
              </li>
            ))}
          </ul>
          <p style={{ color: "#777", fontSize: 12 }}>Items marked * are mandatory.</p>
        </section>
      )}

      {links.length > 0 && (
        <section>
          <h2 style={{ fontSize: 20 }}>Legislation and useful information</h2>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
            {links.map((link, i) => (
              <li key={i}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p>
        <Link className="secondary-action" href="/licensing">Back to permits</Link>
      </p>
    </main>
  );
}
