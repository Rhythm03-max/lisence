"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { searchPermitAction } from "@/lib/actions/public";
import { PublicPermitCard } from "@/components/PermitCard";
import type { PublicPermit } from "@/lib/types";

export function PublicPermitSearch({
  initialQuery = "",
  autoSearch = false,
  readHash = false,
}: {
  initialQuery?: string;
  autoSearch?: boolean;
  readHash?: boolean;
}) {
  const [permitNumber, setPermitNumber] = useState(initialQuery);
  const [issuedDate, setIssuedDate] = useState("");
  const [holder, setHolder] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<PublicPermit | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const didAuto = useRef(false);

  async function runSearch(number: string, date: string, holderName: string) {
    setBusy(true);
    setError("");
    setStatus("");
    setResult(null);
    setPhotoUrl(null);

    const response = await searchPermitAction({
      permitNumber: number,
      issuedDate: date,
      holder: holderName,
    });
    setBusy(false);
    setSearched(true);

    if (!response.ok) {
      setError(response.error ?? "Search failed.");
      return;
    }
    if (!response.permit) {
      setStatus("No permit matches the details provided.");
      return;
    }
    setResult(response.permit);
    setPhotoUrl(response.photoUrl ?? null);

    if (typeof document !== "undefined") {
      requestAnimationFrame(() =>
        document.querySelector(".permit-search-results")?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  }

  useEffect(() => {
    if (autoSearch && initialQuery && !didAuto.current) {
      didAuto.current = true;
      runSearch(initialQuery, "", "");
    }
  }, [autoSearch, initialQuery]);

  useEffect(() => {
    if (!readHash) return;

    function lookupFromHash() {
      const match = window.location.hash.match(/\/publicsearch\/wp\/([^/?#]+)/i);
      if (!match) return;
      const number = decodeURIComponent(match[1]);
      setPermitNumber(number);
      runSearch(number, "", "");
    }

    lookupFromHash();
    window.addEventListener("hashchange", lookupFromHash);
    return () => window.removeEventListener("hashchange", lookupFromHash);
  }, [readHash]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(permitNumber, issuedDate, holder);
  }

  return (
    <div className={searched && result ? "showing-permit-result" : undefined}>
      <h1>Enter the details of the permit you are looking for</h1>
      <form className="permit-lookup" onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="permit-number">Permit Number</label>
          <input
            id="permit-number"
            name="permitNumber"
            placeholder="Insert the permit number"
            value={permitNumber}
            onChange={(e) => setPermitNumber(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="issued-date">Issued Date</label>
          <input
            id="issued-date"
            name="issuedDate"
            type="date"
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="permit-holder">Permit Holder</label>
          <input
            id="permit-holder"
            name="permitHolder"
            placeholder="Insert the permit holder name."
            value={holder}
            onChange={(e) => setHolder(e.target.value)}
          />
        </div>
        <button className="secondary-action lookup-submit" type="submit" disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </button>
        <p className={`form-status${error ? " error" : ""}`} aria-live="polite">
          {error || status}
        </p>
      </form>

      <section
        className={`permit-search-results${result ? " showing" : ""}`}
        aria-live="polite"
      >
        {result && (
          <>
            <h2 className="sr-only">Permit result</h2>
            <PublicPermitCard permit={result} photoUrl={photoUrl} />
          </>
        )}
        {searched && !result && !error && (
          <p style={{ color: "#666" }}>No public permit record was found for the details provided.</p>
        )}
      </section>
    </div>
  );
}
