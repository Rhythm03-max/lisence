"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelApplicationAction } from "@/lib/actions/applicant";
import type { ApplicationStatus } from "@/lib/types";

export function ApplicationActions({
  applicationId,
  slug,
  status,
}: {
  applicationId: string;
  slug: string;
  status: ApplicationStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canEdit = status === "draft" || status === "more_info_required";
  const canCancel = ["draft", "submitted", "more_info_required"].includes(status);

  async function onCancel() {
    setBusy(true);
    setError("");
    const result = await cancelApplicationAction(applicationId);
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not cancel.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="account-actions-row" style={{ marginTop: 0, alignItems: "center" }}>
      {error && <p className="form-status error" aria-live="polite" style={{ marginRight: "auto" }}>{error}</p>}
      {canEdit && (
        <Link className="primary-action" href={`/apply/${slug}?application=${applicationId}`}>
          {status === "draft" ? "Continue application" : "Provide more information"}
        </Link>
      )}
      {canCancel && (
        <button className="secondary-action" type="button" onClick={onCancel} disabled={busy}>
          {busy ? "Cancelling…" : "Cancel application"}
        </button>
      )}
    </div>
  );
}
