import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { listProfiles } from "@/lib/admin-data";
import { UsersTable } from "@/components/admin/UsersTable";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const profiles = await listProfiles();

  return (
    <>
      <section className="admin-intro">
        <div>
          <p className="admin-eyebrow">ACCESS CONTROL</p>
          <h2>Users</h2>
          <p>Manage roles and account access for platform users.</p>
        </div>
        <div className="record-total"><strong>{profiles.length}</strong><span>Accounts</span></div>
      </section>

      <UsersTable profiles={profiles} currentUserId={me.id} />
    </>
  );
}
