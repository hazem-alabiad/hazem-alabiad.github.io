export interface CvLinkFields {
  cvFileData?: string;
  cvUrl?: string;
  cvFileName?: string;
}

export function resolveCvHref(hero: CvLinkFields, fallback: string) {
  return hero.cvFileData || hero.cvUrl || fallback;
}

export function resolveCvName(hero: CvLinkFields, fallback: string) {
  return hero.cvFileName || (hero.cvUrl ? "resume.pdf" : fallback);
}

export interface EditContentAccessContext {
  hostname: string;
  search: string;
  storageValue: string | null;
}

export function canShowEditContent({ hostname, search, storageValue }: EditContentAccessContext) {
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
  const hasOwnerQuery = new URLSearchParams(search).get("owner") === "hazem";
  const hasOverride = storageValue === "true";

  return isLocalhost || hasOwnerQuery || hasOverride;
}
