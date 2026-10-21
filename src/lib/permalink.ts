/**
 * Builds the canonical public URL for a permit record, matching the reference
 * platform shape:
 *   <site>/wps/portal/business/home/searchpermits/#/publicsearch/wp/<permitNumber>
 *
 * The two path segments before the hash are display-only and are ignored when
 * the route resolves on the client, so both the reference-style URL and the
 * short `/searchpermits/#/publicsearch/wp/<permitNumber>` open the same record.
 */
export function permitPublicUrl(siteUrl: string, permitNumber: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return `${base}/wps/portal/business/home/searchpermits/#/publicsearch/wp/${encodeURIComponent(permitNumber)}`;
}

/** The path-only permalink (same origin), for in-app links. */
export function permitPublicPath(permitNumber: string): string {
  return `/wps/portal/business/home/searchpermits/#/publicsearch/wp/${encodeURIComponent(permitNumber)}`;
}
