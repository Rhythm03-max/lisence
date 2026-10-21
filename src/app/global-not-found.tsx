import "@/app/globals.css";
import Link from "next/link";

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body>
        <main id="main-content" style={{ padding: "120px 20px" }}>
          <div className="site-width">
            <h1 style={{ fontSize: 34, fontWeight: 300 }}>Page not found</h1>
            <p>The page you are looking for does not exist or has been moved.</p>
            <p><Link href="/" style={{ color: "#0870bc" }}>Return to the home page</Link></p>
          </div>
        </main>
      </body>
    </html>
  );
}
