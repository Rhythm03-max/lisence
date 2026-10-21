"use client";

import { signOutAction } from "@/lib/actions/auth";

export function LogoutButton({ label = "LOGOUT", className = "link-button" }: { label?: string; className?: string }) {
  return (
    <form action={signOutAction} className="logout-form">
      <button type="submit" className={className}>{label}</button>
    </form>
  );
}
