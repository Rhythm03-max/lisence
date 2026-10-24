"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { LogoutButton } from "@/components/LogoutButton";
import type { Profile } from "@/lib/types";

const NAV = [
  { key: "home", href: "/", label: "Home", icon: <><path d="m3 10 9-8 9 8M5 9v12h14V9M9 21v-7h6v7" /></> },
  { key: "licensing", href: "/licensing", label: "Licensing", icon: <><path d="M6 2h9l4 4v16H6zM15 2v5h4M9 11h7M9 15h7M9 19h5" /></> },
  { key: "search", href: "/search-permits", label: "Search Permits", icon: <><rect x="5" y="2" width="14" height="20" rx="1" /><circle cx="12" cy="9" r="2.5" /><path d="M8.5 18c.5-2.2 1.7-3.2 3.5-3.2s3 1 3.5 3.2" /></> },
  { key: "news", href: "/news", label: "News", icon: <><path d="M3 5h18v14H3zM7 8h3v3H7zM13 8h5M13 11h5M7 14h11M7 17h11" /></> },
  { key: "faq", href: "/faq-notices", label: "FAQ's & Notices", icon: <><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none" /><path d="M12 10v7M12 6.8h.01" stroke="#fff" strokeWidth="2.2" /></> },
];

function isActive(key: string, pathname: string): boolean {
  if (key === "home") return pathname === "/";
  if (key === "licensing") return pathname.startsWith("/licensing") || pathname.startsWith("/apply");
  if (key === "search") return pathname.startsWith("/search-permits");
  if (key === "news") return pathname.startsWith("/news");
  if (key === "faq") return pathname.startsWith("/faq-notices");
  return false;
}

export function SiteHeader({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [query, setQuery] = useState("");

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/search-permits?q=${encodeURIComponent(q)}` : "/search-permits");
  }

  return (
    <div data-site-header>
      <header className="site-header">
        <div className="header-top site-width">
          <Link className="government-brand" href="/" aria-label="Mauritius Business Licensing Platform home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/images/coat-of-arms-mauritius.png" alt="Republic of Mauritius" />
          </Link>
          <div className="platform-name">Mauritius Business Licensing Platform</div>
          <div className="header-actions">
            <form className="top-search" role="search" onSubmit={onSearch}>
              <label className="sr-only" htmlFor="top-search-input">Search</label>
              <input
                id="top-search-input"
                type="search"
                placeholder="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" aria-label="Search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9.5" cy="9.5" r="5.5" strokeWidth="3" />
                  <path d="M14 14l6.2 6.2" strokeWidth="4.2" />
                </svg>
              </button>
            </form>
            {profile ? (
              <>
                {profile.role === "admin" || profile.role === "officer" ? (
                  <Link href="/admin">ADMIN</Link>
                ) : (
                  <Link href="/dashboard">MY ACCOUNT</Link>
                )}
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/register">REGISTER</Link>
                <Link href="/login">LOGIN</Link>
              </>
            )}
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={navOpen}
              aria-controls="main-nav"
              onClick={() => setNavOpen((v) => !v)}
            >
              <span className="sr-only">Open navigation</span>
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>

        <nav className={`main-nav${navOpen ? " open" : ""}`} id="main-nav" aria-label="Primary navigation">
          <div className="nav-inner site-width">
            {NAV.map((item) => (
              <Link
                key={item.key}
                className={`nav-link${isActive(item.key, pathname) ? " active" : ""}`}
                href={item.href}
                aria-current={isActive(item.key, pathname) ? "page" : undefined}
                onClick={() => setNavOpen(false)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">{item.icon}</svg>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </header>
    </div>
  );
}
