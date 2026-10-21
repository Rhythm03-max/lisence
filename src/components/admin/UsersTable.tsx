"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProfileRoleAction, toggleProfileActiveAction } from "@/lib/actions/admin";
import { formatDate } from "@/lib/format";
import type { Profile, UserRole } from "@/lib/types";

export function UsersTable({ profiles, currentUserId }: { profiles: Profile[]; currentUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  function changeRole(id: string, role: UserRole) {
    setBusyId(id);
    setError("");
    startTransition(async () => {
      const result = await setProfileRoleAction(id, role);
      setBusyId("");
      if (!result.ok) setError(result.error ?? "Could not update the role.");
      router.refresh();
    });
  }

  function toggleActive(id: string) {
    setBusyId(id);
    setError("");
    startTransition(async () => {
      const result = await toggleProfileActiveAction(id);
      setBusyId("");
      if (!result.ok) setError(result.error ?? "Could not update the account.");
      router.refresh();
    });
  }

  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div><span>01</span><h2>User accounts</h2></div>
        <span style={{ color: "#647585", fontSize: 12 }}>{profiles.length} accounts</span>
      </div>
      {error && <p className="admin-form-status error" style={{ padding: "0 20px" }}>{error}</p>}
      <div className="records-table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Registered</th><th>Role</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {profiles.map((profile) => {
              const isSelf = profile.id === currentUserId;
              return (
                <tr key={profile.id}>
                  <td>{[profile.first_name, profile.last_name].filter(Boolean).join(" ") || "—"}{isSelf ? " (you)" : ""}</td>
                  <td>{profile.email ?? "—"}</td>
                  <td>{formatDate(profile.created_at.slice(0, 10))}</td>
                  <td>
                    <select
                      value={profile.role}
                      disabled={isSelf || (busyId === profile.id && pending)}
                      onChange={(e) => changeRole(profile.id, e.target.value as UserRole)}
                      style={{ height: 32, padding: "0 8px", border: "1px solid #cfd9e0", borderRadius: 4, fontSize: 12 }}
                    >
                      <option value="applicant">Applicant</option>
                      <option value="officer">Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`status-pill ${profile.is_active ? "approved" : "rejected"}`}>
                      {profile.is_active ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="admin-link-button"
                      disabled={isSelf || (busyId === profile.id && pending)}
                      onClick={() => toggleActive(profile.id)}
                      style={{ opacity: isSelf ? 0.4 : 1 }}
                    >
                      {profile.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
