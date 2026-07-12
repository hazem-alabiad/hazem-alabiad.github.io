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
  isSignedIn: boolean;
}

export function canShowEditContent({ hostname, isSignedIn }: EditContentAccessContext) {
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".local");
  return isSignedIn || isLocalHost;
}

export const OWNER_GITHUB_USERNAME = "hazem-alabiad";

export async function verifyOwnerGitHubToken(token: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    return { ok: false };
  }

  const data = await response.json() as { login?: string };
  return {
    ok: Boolean(data.login),
    login: data.login,
  };
}
