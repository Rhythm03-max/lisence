"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function HomeSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = q.trim();
    if (!query) {
      setMessage("Enter a permit, licence or keyword to search.");
      return;
    }
    router.push(`/licensing?q=${encodeURIComponent(query)}`);
  }

  return (
    <form className="licensing-search" role="search" onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="licensing-search-input">Search licensing platform</label>
      <input
        id="licensing-search-input"
        type="search"
        placeholder="Search licensing platform"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit">Search</button>
      <p className="search-message" aria-live="polite">{message}</p>
    </form>
  );
}
