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

// Only the verified owner (GitHub-authenticated) may see edit controls.
// The localhost bypass has been intentionally removed — sign-in is always required.
export function canShowEditContent({ isSignedIn }: EditContentAccessContext) {
  return isSignedIn;
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
