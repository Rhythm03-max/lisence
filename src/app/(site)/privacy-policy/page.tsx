import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <main className="legal-main site-width" id="main-content">
      <h1>PRIVACY POLICY</h1>
      <section>
        <h2>I. Introduction</h2>
        <p>Welcome to the State of Mauritius&apos; National E-Licensing System. For the purposes of this Policy, the terms &ldquo;we&rdquo;, &ldquo;us&rdquo; and &ldquo;our&rdquo; refer to the State of Mauritius or its agencies. &ldquo;You&rdquo; refers to you as the user of this web site.</p>
        <p>Explained in this section is our policy regarding any personal information you may supply to us when you visit our website. Our Privacy Policy has been developed as an extension of our commitment to combine the highest-quality services with the highest level of integrity in dealing with all users of the website. The Policy is designed to assist you in understanding how we collect, use and safeguard personal information you provide to us and to assist you to make informed decisions. We will treat personal data that you provide through this website according to this privacy policy. This statement will be continuously assessed against new technologies, business practices and our customers&apos; needs. By visiting our website, you agree to be bound by this policy.</p>
      </section>
      <section>
        <h2>II. Personal Data we collect from user of this website</h2>
        <p>The types of personal information you provide to us may include: contact information, such as your name, address, telephone number and email address, financial information such as credit card number.</p>
      </section>
      <section>
        <h2>III. How do we protect personal information?</h2>
        <p>When you register on the website we use a secure server. The secure server software (SSL) encrypts all information you input before it is sent to us. Furthermore, all sensitive data we collect is protected at multiple security levels against unauthorized access, tampering and disclosure.</p>
      </section>
      <section>
        <h2>IV. Credit card details</h2>
        <p>All credit card payments are processed securely through the relevant commercial bank&apos;s payment gateways. Payment by credit card is the fastest way as there is no clearance delay. We do not store any credit card information on our servers.</p>
      </section>
      <section>
        <h2>V. Your Consent</h2>
        <p>By using this website, you consent to the collection and use of this information by us. If we decide to change our privacy policy, we will post those changes on this page so that you are always aware of what information we collect, how we use it, and under what circumstances we disclose it. If you have questions about this privacy policy, please send an email to: <a href="mailto:e-licensing@edbmauritius.org">e-licensing@edbmauritius.org</a></p>
      </section>
      <section>
        <h2>VI. Security</h2>
        <p>We use reasonable measures to protect personal data from unauthorized access, deletion or alteration.</p>
      </section>
    </main>
  );
}
