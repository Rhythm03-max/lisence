"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { initials } from "@/lib/format";
import type { Profile } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Dashboard", glyph: "⌂", exact: true },
  { href: "/admin/records", label: "Permit Records", glyph: "▤" },
  { href: "/admin/applications", label: "Applications", glyph: "✎" },
  { href: "/admin/users", label: "Users", glyph: "☺" },
  { href: "/admin/content", label: "Content", glyph: "▦" },
];

const SECONDARY = [
  { href: "/search-permits", label: "Public Permit Search", glyph: "⌕" },
  { href: "/", label: "Return to Website", glyph: "↩" },
];

function titleFor(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/records/new")) return "Add permit record";
  if (/^\/admin\/records\/[^/]+/.test(pathname)) return "Edit permit record";
  if (pathname.startsWith("/admin/records")) return "Permit records";
  if (/^\/admin\/applications\/[^/]+/.test(pathname)) return "Application review";
  if (pathname.startsWith("/admin/applications")) return "Applications";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/content")) return "Content";
  return "Administration";
}

export function AdminShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const pathname = usePathname();
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email || "Administrator";

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Administration navigation">
        <Link className="admin-brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/images/coat-of-arms-mauritius.png" alt="Republic of Mauritius" />
          <span>Business Licensing<br /><strong>Administration</strong></span>
        </Link>
        <nav>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={isActive(item.href, item.exact) ? "active" : undefined}>
              <span aria-hidden="true">{item.glyph}</span>{item.label}
            </Link>
          ))}
          {SECONDARY.map((item) => (
            <Link key={item.href} href={item.href}>
              <span aria-hidden="true">{item.glyph}</span>{item.label}
            </Link>
          ))}
        </nav>
        <p className="admin-storage-note">Secure workspace<br /><strong>Records are protected by Supabase RLS.</strong></p>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div><span>ADMIN PANEL</span><h1>{titleFor(pathname)}</h1></div>
          <div className="admin-user" aria-label="Current administrator">
            <span>{initials(profile.first_name, profile.last_name)}</span>
            <div><strong>{name}</strong><small>{profile.role === "admin" ? "Administrator" : "Permit officer"}</small></div>
            <LogoutButton label="Sign out" className="admin-link-button" />
          </div>
        </header>

        <main className="admin-main" id="admin-main">{children}</main>
      </div>
    </div>
  );
}
