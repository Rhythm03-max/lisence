export function publicPhotoUrl(path?: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/permit-photos/${clean}`;
}

export function applicationDocumentUrl(path?: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/application-documents/${clean}`;
}

export function publicDocumentUrl(path?: string | null): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  const clean = path.replace(/^\/+/, "");
  return `${base}/storage/v1/object/public/permit-documents/${clean}`;
}
