import Link from "next/link";

const CURRENT_URL = "https://business.edbmauritius.org";

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
              <a href="https://govmu.org/EN/Pages/default.aspx" data-print-url="https://govmu.org/EN/Pages/default.aspx">Ministries</a>
              <a href="https://govmu.org/EN/Pages/default.aspx" data-print-url="https://govmu.org/EN/Pages/default.aspx">Departments</a>
              <a href="https://govmu.org/EN/Pages/default.aspx" data-print-url="https://govmu.org/EN/Pages/default.aspx">Parastatal Organisations</a>
              <a href="https://govmu.org/EN/Pages/default.aspx" data-print-url="https://govmu.org/EN/Pages/default.aspx">Other Bodies</a>
            </div>
            <div className="footer-column">
              <h2>Legislations</h2>
              <a href="https://govmu.org/EN/infoservices/justiceanddefence/Pages/default.aspx" data-print-url="https://govmu.org/EN/infoservices/justiceanddefence/Pages/default.aspx">Justice &amp; Defence</a>
            </div>
            <div className="footer-column">
              <h2>Explore Mauritius</h2>
              <a href="https://govmu.org/EN/Pages/exploremauritius.aspx" data-print-url="https://govmu.org/EN/Pages/exploremauritius.aspx">History</a>
            </div>
            <div className="footer-column">
              <h2>Media</h2>
              <a href="https://govmu.org/EN/Pages/ViewAllCommunique.aspx" data-print-url="https://govmu.org/EN/Pages/ViewAllCommunique.aspx">Communiqués</a>
            </div>
            <div className="footer-column other-links">
              <h2>Other links</h2>
              <a href="https://govmu.org/EN/Pages/ViewAllNews.aspx" data-print-url="https://govmu.org/EN/Pages/ViewAllNews.aspx">News</a>
              <a href="https://govmu.org/EN/Pages/eservices.aspx" data-print-url="https://govmu.org/EN/Pages/eservices.aspx">E-Services</a>
              <a href="/wps/wcm/connect/business/2fd3d85c-d2ff-4068-a0cb-a70a134f518a/ISMS-POL+-+ISMS+Policy+v2.0.pdf?MOD=AJPERES&CVID=pbRlDgO&attachment=true&id=1712915260848" data-print-url="/wps/wcm/connect/business/2fd3d85c-d2ff-4068-a0cb-a70a134f518a/ISMS-POL+-+ISMS+Policy+v2.0.pdf?MOD=AJPERES&CVID=pbRlDgO&attachment=true&id=1712915260848" target="_blank" rel="noopener">ISMS Policy</a>
              <a href="/wps/wcm/connect/business/5fb022e9-8cf8-43d7-a785-ae8f72840d80/ISMS-POL-Supplier_Relationships_Policy_v1.0.pdf?MOD=AJPERES&CVID=oUeeC4F&attachment=true&id=1712918672657" data-print-url="/wps/wcm/connect/business/5fb022e9-8cf8-43d7-a785-ae8f72840d80/ISMS-POL-Supplier_Relationships_Policy_v1.0.pdf?MOD=AJPERES&CVID=oUeeC4F&attachment=true&id=1712918672657" target="_blank" rel="noopener">Supplier Relationship Policy</a>
              <a href="/wps/portal/business/home/termsOfUse/" data-print-url="/wps/portal/business/home/termsOfUse/">Terms of Use</a>
              <a href="/wps/portal/business/home/privacyPolicy/" data-print-url="/wps/portal/business/home/privacyPolicy/">Privacy Policy</a>
              <a href="/wps/wcm/connect/business/603e5254-36a2-4655-a19c-c557a654fb27/BusinessContact.pdf?MOD=AJPERES&CVID=n9q1HGt&CVID=n9q1HGt&attachment=true&id=1590648334143" data-print-url="/wps/wcm/connect/business/603e5254-36a2-4655-a19c-c557a654fb27/BusinessContact.pdf?MOD=AJPERES&CVID=n9q1HGt&CVID=n9q1HGt&attachment=true&id=1590648334143" target="_blank" rel="noopener">Contact Us</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="helpdesk">Helpdesk Contact:<br /><a href="https://edbmauritius.atlassian.net/servicedesk/customer/portal/13" target="_blank" rel="noopener" data-print-url="https://edbmauritius.atlassian.net/servicedesk/customer/portal/13">Click Here</a></p>
            <p className="security-notice">
              <strong>Security Notice:</strong> You are accessing the official website of the National E-Licensing portal at https://business.edbmauritius.org. Always verify the website address before entering your login details. Please report any suspicious link/message to <a href="mailto:nels@edbmauritius.org">nels@edbmauritius.org</a>.
            </p>
          </div>
        </div>
      </footer>
      <div className="print-page-footer" aria-hidden="true">
        <span className="print-page-url">https://business.edbmauritius.org/wps/portal/business/home/searchpermits/!ut/p/z1/04_Sj9CPykssy0xPLMnMz0vMAfIjo8zizY0cjTwdLQz8DZy...</span>
        <span className="print-page-number">1/1</span>
      </div>
      {verify ? <MobileVerifyFooter /> : null}
    </div>
  );
}
