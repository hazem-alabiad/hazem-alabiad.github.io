import { type CSSProperties, type ReactNode } from "react";
import { todayISO } from "../github";
import { OWNER_LOGIN, type BlogAuthorUser } from "./authors";

export const BLOG_TOKEN_KEY = "hazem-blog-token";
export const BLOG_USER_KEY = "hazem-blog-user";

export const MONO: CSSProperties = { fontFamily: "var(--font-mono)" };
export const DISPLAY: CSSProperties = { fontFamily: "var(--font-display)" };
export const FIELD: CSSProperties = {
  ...MONO,
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
  background: "var(--bg-elevated)",
  border: "1px solid var(--rule-soft)",
  color: "var(--ink)",
  padding: "8px 12px",
  outline: "none",
  borderRadius: 6,
};

export function Label({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 6 }}>
      {children}
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule-soft)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.22em", color: "var(--violet)", marginBottom: 16 }}>▸ {title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

export function chipBtn(color: string, solid = false): CSSProperties {
  return {
    ...MONO, fontSize: 10, letterSpacing: "0.12em",
    color: solid ? "var(--amber-ink)" : color,
    background: solid ? "var(--amber)" : "transparent",
    border: `1px solid ${solid ? "var(--amber)" : color}`,
    borderRadius: 6, padding: "6px 12px", cursor: "pointer",
    display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
  };
}

export function sanitizeToken(token: string): string {
  return token.replace(/[^\x20-\x7E]/g, "").trim();
}

export async function verifyToken(raw: string): Promise<BlogAuthorUser> {
  const token = sanitizeToken(raw);
  if (!token) throw new Error("Token is empty or contains unsupported characters.");
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${token}`, "User-Agent": "hazem-portfolio" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Verification failed (HTTP ${res.status}).`);
  const user: BlogAuthorUser = { login: data.login as string, email: (data.email as string | null) ?? null };
  if (user.login !== OWNER_LOGIN) throw new Error(`Only the site owner (@${OWNER_LOGIN}) can manage posts.`);
  return user;
}

export function saveBlogSession(token: string, login: string) {
  try { localStorage.setItem(BLOG_TOKEN_KEY, sanitizeToken(token)); localStorage.setItem(BLOG_USER_KEY, login); } catch { /* storage unavailable */ }
}

export function loadBlogSession(): { token: string; login: string } | null {
  try {
    const t = localStorage.getItem(BLOG_TOKEN_KEY);
    if (t) return { token: t, login: localStorage.getItem(BLOG_USER_KEY) || "saved session" };
  } catch { /* storage unavailable */ }
  return null;
}

export function clearBlogSession() {
  try { localStorage.removeItem(BLOG_TOKEN_KEY); localStorage.removeItem(BLOG_USER_KEY); localStorage.removeItem("hazem-cms-token"); } catch { /* storage unavailable */ }
}

export interface BlogDraft {
  isNew: boolean;
  slug: string;
  path: string;
  sha?: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  accent: string;
  author: string;
  body: string;
}

export const EMPTY_DRAFT: BlogDraft = { isNew: true, slug: "", path: "", title: "", date: todayISO(), description: "", tags: [], accent: "amber", author: OWNER_LOGIN, body: "" };

export function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
  const fm: Record<string, string> = {};
  let body = raw;
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (m) {
    body = raw.slice(m[0].length).trim();
    for (const line of m[1].split("\n")) {
      const i = line.indexOf(":");
      if (i < 0) continue;
      const key = line.slice(0, i).trim();
      let val = line.slice(i + 1).trim();
      try { val = JSON.parse(val); } catch { /* keep raw */ }
      fm[key] = String(val ?? "");
    }
  }
  return { fm, body };
}

export function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim().replace(/[\[\]"]/g, "")).filter(Boolean);
}

export function buildMdx(d: BlogDraft): string {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const lines = ["---"];
  lines.push(`title: "${esc(d.title)}"`);
  lines.push(`date: "${d.date}"`);
  lines.push(`description: "${esc(d.description)}"`);
  if (d.author && d.author.trim()) lines.push(`author: "${esc(d.author.trim())}"`);
  if (d.tags.length) lines.push(`tags: [${d.tags.map((t) => `"${esc(t)}"`).join(", ")}]`);
  if (d.accent) lines.push(`accent: "${d.accent}"`);
  lines.push("---", "");
  return lines.join("\n") + d.body.trim() + "\n";
}