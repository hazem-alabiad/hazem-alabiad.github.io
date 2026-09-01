// ─── Blog author gate ────────────────────────────────────────────────────────
// Only the site owner may manage posts from the /blog page.
// Matches against the GitHub account used to unlock.

export const OWNER_LOGIN = "hazem-alabiad";

export interface BlogAuthorUser {
  login: string;
  email: string | null;
}

export function isAuthorized(user: BlogAuthorUser): boolean {
  return user.login === OWNER_LOGIN;
}