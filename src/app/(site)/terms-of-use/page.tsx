import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Use" };

const TERMS = [
  "By accessing and using the website, you shall be deemed to have accepted and agreed to be legally bound by these Terms of Use. If you do not accept the Terms of Use, please do not use the website.",
  "This website is the State of Mauritius' National E-Licensing System. The information or features on the website may be modified or discontinue at any time, with or without notice to you, and without liability.",
  "All the information provided on the website is offered for informational purposes only. The materials provide general information about the matters discussed, and do not constitute legal advice or legal opinions on any specific matters.",
  "Links to other websites that have been included on this website are provided for your convenience only. The availability of such linked websites cannot be guarantee.",
  "The State of Mauritius accepts no responsibility in relation to the accuracy, completeness, usefulness or otherwise, of the contents of any websites, nor does it endorse any views expressed on any websites. Users are advised to verify/check any information with the relevant public-sector agencies and/or other source(s), and to obtain any appropriate professional advice before acting on any other websites.",
  "The State of Mauritius does not make any warranty or representation whatsoever, including that your use of, or access of, the website and its applications will be uninterrupted, timely, secure, free of bugs, free from human tampering or intervention, free from virus or other malicious, destructive or corrupting code, programme or macro, free from transmission errors or otherwise error-free or that there will not be any defects or deficiencies in the website and its applications;",
  "The State of Mauritius and its employees do not accept liability however arising, including liability for negligence, for any loss resulting from the use of or reliance upon the information and/or reliance on its availability at any time.",
  "The State of Mauritius does not guarantee continuous accessibility or uninterrupted operation of the website.",
  "The State of Mauritius reserves all rights to deny or restrict access to this website by any person or to block access from any Internet address to this website, at any time, without ascribing any reasons whatsoever.",
  "The use of the website and these Terms of Use and all its subsequent variations shall be subject to, governed by and interpreted in accordance with the laws of Mauritius, and you hereby agree to submit to the exclusive jurisdiction of the Mauritian courts in the determination of any dispute arising in connection with the use of the website.",
];

export default function TermsOfUsePage() {
  return (
    <main className="legal-main terms-main site-width" id="main-content">
      <h1>TERMS OF USE</h1>
      <ol className="terms-list">
        {TERMS.map((term, i) => <li key={i}>{term}</li>)}
      </ol>
    </main>
  );
}
