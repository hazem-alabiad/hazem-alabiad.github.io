import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Save } from "lucide-react";
import { todayISO } from "../github";
import { OWNER_LOGIN, type BlogAuthorUser } from "./authors";
import { unfurl, type LinkMeta } from "./unfurl";

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

function modeBtn(active: boolean): CSSProperties {
  return {
    ...MONO, fontSize: 9, letterSpacing: "0.14em",
    padding: "4px 10px", cursor: "pointer", borderRadius: 4,
    color: active ? "var(--amber-ink)" : "var(--ink-faint)",
    background: active ? "var(--amber)" : "transparent",
    border: `1px solid ${active ? "var(--amber)" : "var(--rule)"}`,
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
  try { localStorage.removeItem(BLOG_TOKEN_KEY); localStorage.removeItem(BLOG_USER_KEY); } catch { /* storage unavailable */ }
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

/* ── lightweight markdown preview renderer (dependency-free) ────────────── */

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]+&quot;)?\)/g, '<img src="$2" alt="$1" />')
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+&quot;[^&]+&quot;)?\)/g, '<a href="$2">$1</a>');
}

export function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let list: "ul" | "ol" | null = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  const para = /^```|^#{1,6}\s|^>\s?|^[-*+]\s|^\d+[.)]\s|^\s*---+\s*$/;

  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      closeList();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code${fence[1] ? ` data-lang="${fence[1]}"` : ""}>${buf.map(esc).join("\n")}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { closeList(); const lv = h[1].length; out.push(`<h${lv}>${inline(h[2])}</h${lv}>`); i++; continue; }
    if (/^\s*---+\s*$/.test(line)) { closeList(); out.push("<hr />"); i++; continue; }
    if (/^>\s?/.test(line)) {
      closeList();
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote><p>${buf.map(inline).join(" ")}</p></blockquote>`);
      continue;
    }
    const ul = line.match(/^[-*+]\s+(.*)$/);
    if (ul) { if (list !== "ul") { closeList(); list = "ul"; out.push("<ul>"); } out.push(`<li>${inline(ul[1])}</li>`); i++; continue; }
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ol) { if (list !== "ol") { closeList(); list = "ol"; out.push("<ol>"); } out.push(`<li>${inline(ol[1])}</li>`); i++; continue; }
    if (line.trim() === "") { closeList(); i++; continue; }
    closeList();
    const buf: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !para.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push(`<p>${buf.map(inline).join(" ")}</p>`);
  }
  closeList();
  return out.join("\n");
}

/* ── editor panel (shared by the admin screen + inline manage) ──────────── */

export function EditorPanel({ draft, onDraft, busy, onSave, onCancel }: {
  draft: BlogDraft;
  onDraft: (d: BlogDraft) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const linkAt = useRef<number | null>(null);
  const [link, setLink] = useState<{ url: string; meta: LinkMeta | null; loading: boolean; error: string } | null>(null);

  const input = (v: string, on: (x: string) => void) => <input value={v} onChange={(e) => on(e.target.value)} style={FIELD} />;

  function openLink() {
    const sel = bodyRef.current?.selectionStart ?? draft.body.length;
    linkAt.current = sel;
    setLink({ url: "", meta: null, loading: false, error: "" });
  }

  async function fetchLink() {
    if (!link || !link.url.trim()) return;
    setLink({ ...link, loading: true, error: "" });
    try {
      const meta = await unfurl(link.url.trim());
      setLink({ ...link, loading: false, meta });
    } catch (e) {
      setLink({ ...link, loading: false, error: (e as Error).message });
    }
  }

  function insertLink() {
    if (!link?.meta) return;
    const at = linkAt.current ?? draft.body.length;
    const md = `[${link.meta.title}](${link.meta.url})`;
    onDraft({ ...draft, body: draft.body.slice(0, at) + md + draft.body.slice(at) });
    setLink(null);
  }

  return (
    <Panel title={draft.isNew ? "NEW POST" : `EDITING · ${draft.path}`}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>SLUG {draft.isNew && <span style={{ opacity: 0.6 }}>— auto from title</span>}</Label>
          {input(draft.slug, (s) => onDraft({ ...draft, slug: s }))}
        </div>
        <div>
          <Label>DATE</Label>
          {input(draft.date, (s) => onDraft({ ...draft, date: s }))}
        </div>
      </div>
      <div>
        <Label>TITLE</Label>
        {input(draft.title, (s) => onDraft({ ...draft, title: s }))}
      </div>
      <div>
        <Label>DESCRIPTION</Label>
        <textarea value={draft.description} onChange={(e) => onDraft({ ...draft, description: e.target.value })} rows={2} style={FIELD} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <Label>TAGS (comma-separated)</Label>
          {input(draft.tags.join(", "), (s) => onDraft({ ...draft, tags: s.split(",").map((t) => t.trim()).filter(Boolean) }))}
        </div>
        <div>
          <Label>ACCENT</Label>
          <select value={draft.accent} onChange={(e) => onDraft({ ...draft, accent: e.target.value })} style={FIELD}>
            <option value="amber">amber</option>
            <option value="sage">sage</option>
            <option value="violet">violet</option>
            <option value="pink">pink</option>
          </select>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Label>BODY — MARKDOWN</Label>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={openLink} style={chipBtn("var(--blue)")}>INSERT LINK</button>
            <button onClick={() => setMode("write")} style={modeBtn(mode === "write")}>WRITE</button>
            <button onClick={() => setMode("preview")} style={modeBtn(mode === "preview")}>PREVIEW</button>
          </div>
        </div>
        {mode === "write" ? (
          <textarea ref={bodyRef} value={draft.body} onChange={(e) => onDraft({ ...draft, body: e.target.value })} rows={14} style={FIELD} />
        ) : (
          <div style={{ border: "1px solid var(--rule-soft)", borderRadius: 6, padding: "2px 20px 8px", background: "var(--bg-elevated)" }}>
            <div style={{ ...MONO, fontSize: 12, color: "var(--ink-dim)", borderBottom: "1px solid var(--rule-soft)", padding: "10px 0 8px", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {draft.title || "Untitled"} · {draft.date} {draft.tags.length ? `· ${draft.tags.join(", ")}` : ""}
            </div>
            {draft.description && (
              <p style={{ ...DISPLAY, fontStyle: "italic", fontSize: 16, color: "var(--ink-dim)", margin: "0 0 12px" }}>{draft.description}</p>
            )}
            <div className="blog-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.body) }} />
          </div>
        )}
        {link && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} placeholder="https://…" style={{ ...FIELD, flex: 1 }} />
            <button onClick={fetchLink} disabled={link.loading} style={chipBtn("var(--blue)")}>{link.loading ? "…" : "FETCH"}</button>
            {link.meta && <button onClick={insertLink} style={chipBtn("var(--sage)", true)}>INSERT</button>}
            <button onClick={() => setLink(null)} style={chipBtn("var(--ink-dim)")}>✕</button>
          </div>
        )}
        {link?.error && <div style={{ ...MONO, fontSize: 11, color: "var(--red)" }}>✗ {link.error}</div>}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button onClick={onSave} disabled={busy} style={chipBtn("var(--amber)", true)}>
          <Save size={12} /> {busy ? "SAVING…" : draft.isNew ? "PUBLISH POST" : "SAVE POST"}
        </button>
        <button onClick={onCancel} disabled={busy} style={chipBtn("var(--ink-dim)")}>CANCEL</button>
      </div>
    </Panel>
  );
}