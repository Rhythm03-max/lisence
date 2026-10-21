"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewApplicationAction, type ReviewDecision } from "@/lib/actions/admin";

const DECISIONS: { key: ReviewDecision; label: string; className: string }[] = [
  { key: "approve", label: "Approve & issue permit", className: "admin-primary" },
  { key: "more_info", label: "Request more information", className: "admin-secondary" },
  { key: "review", label: "Mark under review", className: "admin-secondary" },
  { key: "reject", label: "Reject application", className: "admin-secondary" },
];

export function ReviewForm({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState<ReviewDecision | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function onDecision(decision: ReviewDecision) {
    if ((decision === "reject" || decision === "more_info") && !notes.trim()) {
      setError("Please add reviewer notes explaining the decision.");
      return;
    }
    if (decision === "approve" && !window.confirm("Approve this application and issue a permit record?")) return;

    setBusy(decision);
    setError("");
    setStatus("");
    const result = await reviewApplicationAction(applicationId, decision, notes);
    setBusy(null);
    if (!result.ok) {
      setError(result.error ?? "Could not record the decision.");
      return;
    }
    setStatus(result.recordId ? "Application approved and permit issued." : "Decision saved.");
    router.refresh();
  }

  return (
    <div>
      <label className="admin-textarea-label" style={{ marginTop: 0 }}>
        Reviewer notes
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes visible to the applicant (required for rejections and information requests)."
        />
      </label>
      <p className={`admin-form-status${error ? " error" : ""}`} aria-live="polite">{error || status}</p>
      <div className="admin-form-actions" style={{ flexWrap: "wrap", gap: 10 }}>
        {DECISIONS.map((decision) => (
          <button
            key={decision.key}
            className={decision.className}
            type="button"
            onClick={() => onDecision(decision.key)}
            disabled={busy !== null}
          >
            {busy === decision.key ? "Working…" : decision.label}
          </button>
        ))}
      </div>
    </div>
  );
}
