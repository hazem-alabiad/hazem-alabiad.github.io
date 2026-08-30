// ─── GitHub Contents API helpers for the blog admin ────────────────────────
// The blog is a set of MDX files committed to the repo; the deploy workflow
// rebuilds GitHub Pages on every push to main. Writing posts here via the
// Contents API therefore publishes them for everyone after the next build.

export const GH_OWNER = "hazem-alabiad";
export const GH_REPO = "hazem-alabiad.github.io";
export const GH_BRANCH = "main";
export const POSTS_DIR = "src/blog/posts";

const API = "https://api.github.com";

export interface GhFile {
  path: string;
  sha: string;
  name: string;
}

export interface GhError {
  status: number;
  message: string;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `token ${token}`, "User-Agent": "hazem-portfolio", Accept: "application/vnd.github+json" };
}

async function handle(res: Response): Promise<any> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err: GhError = { status: res.status, message: (data as any)?.message || `HTTP ${res.status}` };
    throw err;
  }
  return data;
}

export async function listPosts(token: string): Promise<GhFile[]> {
  const res = await fetch(`${API}/repos/${GH_OWNER}/${GH_REPO}/contents/${POSTS_DIR}?ref=${GH_BRANCH}`, { headers: authHeaders(token) });
  if (res.status === 404) return [];
  const data = await handle(res);
  return (Array.isArray(data) ? data : [])
    .filter((f: any) => f.type === "file" && f.name.endsWith(".mdx"))
    .map((f: any) => ({ path: f.path, sha: f.sha, name: f.name }));
}

/** Fetch the current SHA for a single file (returns null if not found). */
export async function getFileSha(token: string, path: string): Promise<string | null> {
  const res = await fetch(`${API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`, { headers: authHeaders(token) });
  if (res.status === 404) return null;
  const data = await handle(res);
  return (data as any)?.sha ?? null;
}

export async function readPost(token: string, path: string): Promise<string> {
  const res = await fetch(`${API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}?ref=${GH_BRANCH}`, { headers: authHeaders(token) });
  const data = await handle(res);
  const raw = atob(data.content.replace(/\s/g, ""));
  return new TextDecoder().decode(Uint8Array.from(raw, (c) => c.charCodeAt(0))).trimEnd();
}

export async function writePost(token: string, path: string, content: string, sha?: string): Promise<void> {
  const body: any = { message: sha ? `blog: update ${path}` : `blog: publish ${path}`, branch: GH_BRANCH, content: btoa(unescape(encodeURIComponent(content))) };
  if (sha) body.sha = sha;
  const res = await fetch(`${API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, { method: "PUT", headers: authHeaders(token), body: JSON.stringify(body) });
  await handle(res);
}

export async function deletePost(token: string, path: string, sha: string): Promise<void> {
  const res = await fetch(`${API}/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`, {
    method: "DELETE",
    headers: authHeaders(token),
    body: JSON.stringify({ message: `blog: delete ${path}`, branch: GH_BRANCH, sha }),
  });
  await handle(res);
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "untitled";
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
