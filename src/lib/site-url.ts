import { headers } from "next/headers";

export async function getSiteUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const requestUrl = `${proto}://${host}`;

  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  // A localhost env value must never leak into a real deployment (it is baked
  // into the client bundle at build time). Prefer the actual request host
  // whenever the deployment is not localhost.
  if (envUrl && !(envUrl.includes("localhost") && !host.includes("localhost"))) {
    return envUrl;
  }

  return requestUrl;
}
