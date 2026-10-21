import Link from "next/link";

const CURRENT_URL = "https://business.edlbmauritius.org";

function MobileVerifyFooter() {
  return (
    <footer className="verify-mobile-footer" aria-label="Government portal footer">
      <p className="verify-mobile-helpdesk">Helpdesk contact<br /><a href="mailto:nels@edbmauritius.org">nels@edbmauritius.org</a></p>
      <div className="verify-mobile-accordions">
        <details><summary>Government Directory</summary><div className="verify-mobile-links"><a href="https://govmu.org/EN/Pages/default.aspx">Ministries</a><a href="https://govmu.org/EN/Pages/default.aspx">Departments</a><a href="https://govmu.org/EN/Pages/default.aspx">Parastatal Organisations</a><a href="https://govmu.org/EN/Pages/default.aspx">Other Bodies</a></div></details>
        <details><summary>Legislations</summary><div className="verify-mobile-links"><a href="https://govmu.org/EN/infoservices/justiceanddefence/Pages/default.aspx">Justice &amp; Defence</a></div></details>
        <details><summary>Explore Mauritius</summary><div className="verify-mobile-links"><a href="#history">History</a></div></details>
        <details><summary>Media</summary><div className="verify-mobile-links"><a href="https://govmu.org/EN/Pages/ViewAllCommunique.aspx">Communiqués</a></div></details>
        <details><summary>Other links</summary><div className="verify-mobile-links"><Link href="/news">News</Link><a href="#services">E-Services</a><a href="/assets/documents/ISMS-Policy-v2.0.pdf" download>ISMS Policy</a><a href="/assets/documents/Supplier-Relationships-Policy-v1.0.pdf" download>Supplier Relationship Policy</a><Link href="/terms-of-use">Terms of Use</Link><Link href="/privacy-policy">Privacy Policy</Link><a href="/assets/documents/BusinessContact.pdf" download>Contact Us</a></div></details>
      </div>
      <div className="verify-mobile-secondary">
        <details><summary>Privacy Statement</summary><div className="verify-mobile-links"><Link href="/privacy-policy">Privacy Statement text</Link></div></details>
        <details><summary>Terms of Use</summary><div className="verify-mobile-links"><Link href="/terms-of-use">Terms of Use text</Link></div></details>
        <details><summary>Legal</summary><div className="verify-mobile-links"><Link href="/terms-of-use">Legal text</Link></div></details>
      </div>
      <div className="verify-mobile-government">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/images/coat-of-arms-mauritius.png" alt="Republic of Mauritius" />
        <span>Government of Mauritius</span>
      </div>
    </footer>
  );
}

export function SiteFooter({ verify = false }: { verify?: boolean }) {
  return (
    <div data-site-footer>
      <footer className="footer-wrap inner-page-footer">
        <div className="site-footer site-width">
          <div className="footer-content">
            <div className="certification-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/images/ISO-IEC-27001-2022-Red.png" alt="ISO IEC 27001 2022 Management System MSECB Certified" />
            </div>
            <div className="footer-column">
              <h2>Government Directory</h2>
              <a href="https://govmu.org/EN/Pages/default.aspx">Ministries</a>
              <a href="https://govmu.org/EN/Pages/default.aspx">Departments</a>
              <a href="https://govmu.org/EN/Pages/default.aspx">Parastatal Organisations</a>
              <a href="https://govmu.org/EN/Pages/default.aspx">Other Bodies</a>
            </div>
            <div className="footer-column">
              <h2>Legislations</h2>
              <a href="https://govmu.org/EN/infoservices/justiceanddefence/Pages/default.aspx">Justice &amp; Defence</a>
            </div>
            <div className="footer-column">
              <h2>Explore Mauritius</h2>
              <a href="#history">History</a>
            </div>
            <div className="footer-column">
              <h2>Media</h2>
              <a href="https://govmu.org/EN/Pages/ViewAllCommunique.aspx">Communiqués</a>
            </div>
            <div className="footer-column other-links">
              <h2>Other links</h2>
              <Link href="/news">News</Link>
              <a href="#services">E-Services</a>
              <a href="/assets/documents/ISMS-Policy-v2.0.pdf" download>ISMS Policy</a>
              <a href="/assets/documents/Supplier-Relationships-Policy-v1.0.pdf" download>Supplier Relationship Policy</a>
              <Link href="/terms-of-use">Terms of Use</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <a href="/assets/documents/BusinessContact.pdf" download>Contact Us</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="helpdesk">Helpdesk Contact:<br /><a href="mailto:nels@edbmauritius.org">Click Here</a></p>
            <p className="security-notice">
              <strong>Security Notice:</strong> You are accessing the official Business Licensing Portal at {CURRENT_URL}. Always verify this exact address before entering login details. Report suspicious links or messages to <a href="mailto:nels@edbmauritius.org">nels@edbmauritius.org</a>.
            </p>
          </div>
        </div>
      </footer>
      {verify ? <MobileVerifyFooter /> : null}
    </div>
  );
}
