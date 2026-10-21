import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account Activation" };

export default async function AccountActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="activation-main site-width" id="main-content">
      <h1>Account Activation</h1>
      <div className="activation-copy">
        <p>You should shortly receive a verification email in your mailbox <strong>{email || "your registered email address"}</strong>.</p>
        <p><strong>* If you did not receive the activation link in your inbox, please check your junk/spam folder.</strong></p>
        <p>Please navigate to the link provided in the verification email to validate your email address and activate your account. Your password should be treated securely to safeguard the confidentiality of your information. We will never request you to disclose your password to anyone.</p>
        <p>Once your user account has been activated, please login and complete your registration details to submit your application(s) on the National E-Licensing System.</p>
        <p>Should you require any assistance to create your user account, kindly email us on <a href="mailto:nels@edbmauritius.org">nels@edbmauritius.org</a> with a brief indication of the problem.</p>
      </div>
    </main>
  );
}
