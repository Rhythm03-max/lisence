"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { AgencyGroup, CategoryGroup } from "@/lib/data";

type View = "category" | "agency";
interface Group {
  id: string;
  name: string;
  permits: CategoryGroup["permits"];
}

function safeId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function LicensingCatalog({
  categories,
  agencies,
  initialView = "category",
  query = "",
}: {
  categories: CategoryGroup[];
  agencies: AgencyGroup[];
  initialView?: View;
  query?: string;
}) {
  const [view, setView] = useState<View>(initialView);
  const [search, setSearch] = useState(query);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const groups: Group[] = view === "agency" ? agencies : categories;
  const term = search.trim().toLowerCase();

  const filtered = useMemo(() => {
    return groups
      .map((group) => {
        if (!term) return { group, permits: group.permits, matched: true };
        const matchGroup = group.name.toLowerCase().includes(term);
        const permits = group.permits.filter(
          (p) => matchGroup || p.name.toLowerCase().includes(term),
        );
        return { group, permits, matchGroup, matched: matchGroup || permits.length > 0 };
      })
      .filter((entry) => entry.matched);
  }, [groups, term]);

  const toggle = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const switchView = (next: View) => {
    setView(next);
    setOpenGroups(new Set());
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (next === "agency") url.searchParams.set("view", "agency");
      else url.searchParams.delete("view");
      window.history.replaceState({}, "", url);
    }
  };

  return (
    <>
      <div className="licensing-toolbar">
        <h1>Permits</h1>
        <div className="view-tabs" role="tablist" aria-label="Browse permits">
          <button
            id="category-tab"
            type="button"
            role="tab"
            aria-selected={view === "category"}
            aria-controls="permit-groups"
            onClick={() => switchView("category")}
          >
            Category
          </button>
          <button
            id="agency-tab"
            type="button"
            role="tab"
            aria-selected={view === "agency"}
            aria-controls="permit-groups"
            onClick={() => switchView("agency")}
          >
            Agency
          </button>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <label>
          <span className="sr-only">Filter permits</span>
          <input
            type="search"
            placeholder={`Filter by permit or ${view}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: 372,
              maxWidth: "100%",
              height: 40,
              padding: "0 14px",
              border: "1px solid #c8c8c8",
              borderRadius: 4,
            }}
          />
        </label>
      </div>

      <div className="permit-groups" id="permit-groups" role="tabpanel" aria-labelledby={`${view}-tab`}>
        {filtered.length === 0 && (
          <p style={{ marginTop: 24, color: "#666" }}>No permits match your search.</p>
        )}
        {filtered.map(({ group, permits }) => {
          const id = `${view}-${safeId(group.name)}`;
          const isOpen = term.length > 0 || openGroups.has(id);
          return (
            <section key={id} className={`permit-group${isOpen ? " open" : ""}`}>
              <button
                className="permit-group-toggle"
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => toggle(id)}
              >
                {group.name}
              </button>
              {isOpen && (
                <div className="permit-list" id={id}>
                  {permits.length === 0 && (
                    <p style={{ fontSize: 12, color: "#777" }}>No permits in this group.</p>
                  )}
                  {permits.map((permit) => (
                    <div className="permit-row" key={`${group.id}-${permit.id}`}>
                      <div className="permit-copy">
                        <strong>{permit.name}</strong>
                        <Link href={`/permits/${permit.slug}`}>Legislation and useful information</Link>
                      </div>
                      <Link
                        className="permit-apply"
                        href={`/apply/${permit.slug}`}
                        aria-label={`Apply for ${permit.name}`}
                      >
                        APPLY
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
