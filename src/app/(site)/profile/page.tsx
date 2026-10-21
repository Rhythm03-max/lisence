import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForm } from "@/components/portal/ProfileForm";

export const metadata: Metadata = { title: "My Profile" };

export default async function ProfilePage() {
  const profile = await requireUser("/profile");

  return (
    <main className="portal-main site-width" id="main-content">
      <div className="portal-toolbar">
        <div>
          <h1>My profile</h1>
          <p>Your personal details are used to prefill your applications.</p>
        </div>
      </div>
      <ProfileForm profile={profile} />
    </main>
  );
}
