// ─── Blog author allow-list ────────────────────────────────────────────────
// Who may manage (create / edit / delete) posts from the /blog page.
// Matches against the GitHub account used to unlock (login, and best-effort
// public email). To grant someone access, add their GitHub username to
// `logins`, or their email to `emails`. The owner is allowed by default.

export const BLOG_AUTHORS = {
  logins: ["hazem-alabiad"],
  emails: [],
};

export interface BlogAuthorUser {
  login: string;
  email: string | null;
}

export function isAuthorized(user: BlogAuthorUser): boolean {
  if (BLOG_AUTHORS.logins.includes(user.login)) return true;
  return !!user.email && BLOG_AUTHORS.emails.includes(user.email);
}
