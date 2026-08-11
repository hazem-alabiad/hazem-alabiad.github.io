import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Plus, Trash2, Save, Loader2, Lock, FileText, KeyRound, Search, Link2 } from "lucide-react";
import { listPosts, readPost, writePost, deletePost, slugify, todayISO, type GhFile } from "../github";
import { isAuthorized, type BlogAuthorUser } from "./authors";
import { posts } from "./posts";
import { unfurl, type LinkMeta } from "./unfurl";

const BLOG_TOKEN_KEY = "hazem-blog-token";
const BLOG_USER_KEY = "hazem-blog-user";

const POST_META = new Map<string, { title: string; description: string; tags: string[] }>();
for (const p of posts) POST_META.set(p.slug, { title: p.title, description: p.description, tags: p.tags });

const MONO: CSSProperties = { fontFamily: "var(--font-mono)" };
const DISPLAY: CSSProperties = { fontFamily: "var(--font-display)" };
const FIELD: CSSProperties = {
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

function Label({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule-soft)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
      <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.22em", color: "var(--violet)", marginBottom: 16 }}>▸ {title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function chipBtn(color: string, solid = false): CSSProperties {
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

async function verifyToken(token: string): Promise<BlogAuthorUser> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `token ${token}`, "User-Agent": "hazem-portfolio" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Verification failed (HTTP ${res.status}).`);
  const user: BlogAuthorUser = { login: data.login as string, email: (data.email as string | null) ?? null };
  if (!isAuthorized(user)) throw new Error(`Account "@${user.login}" is not an authorized blog author.`);
  return user;
}

interface BlogDraft {
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

const EMPTY_DRAFT: BlogDraft = { isNew: true, slug: "", path: "", title: "", date: todayISO(), description: "", tags: [], accent: "amber", author: "hazem-alabiad", body: "" };

function parseFrontmatter(raw: string): { fm: Record<string, string>; body: string } {
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

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim().replace(/[\[\]"]/g, "")).filter(Boolean);
}

function buildMdx(d: BlogDraft): string {
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

function renderMarkdown(src: string): string {
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

export default function BlogAdmin() {
  const [stage, setStage] = useState<"checking" | "unlock" | "ready">("checking");
  const [user, setUser] = useState<BlogAuthorUser | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [authErr, setAuthErr] = useState("");

  const [posts, setPosts] = useState<GhFile[]>([]);
  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const linkAt = useRef<number | null>(null);
  const [link, setLink] = useState<{ url: string; meta: LinkMeta | null; loading: boolean; error: string } | null>(null);

  function openLink() {
    const sel = bodyRef.current?.selectionStart ?? draft?.body.length ?? 0;
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
    if (!draft || !link?.meta) return;
    const at = linkAt.current ?? draft.body.length;
    const md = `[${link.meta.title}](${link.meta.url})`;
    setDraft({ ...draft, body: draft.body.slice(0, at) + md + draft.body.slice(at) });
    setLink(null);
  }

  async function refresh(activeToken: string) {
    setLoading(true); setErr("");
    try { setPosts(await listPosts(activeToken)); }
    catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  async function unlock(value: string) {
    if (!value.trim()) return;
    setBusy(true); setAuthErr("");
    try {
      const u = await verifyToken(value);
      try { localStorage.setItem(BLOG_TOKEN_KEY, value); localStorage.setItem(BLOG_USER_KEY, u.login); } catch { /* storage unavailable */ }
      setUser(u); setToken(value); setStage("ready");
      refresh(value);
    } catch (e) { setAuthErr((e as Error).message); }
    finally { setBusy(false); }
  }

  function lock() {
    setUser(null); setToken(""); setDraft(null); setStage("unlock");
  }

  let savedSession: { token: string; login: string } | null = null;
  try {
    const t = localStorage.getItem(BLOG_TOKEN_KEY);
    if (t) savedSession = { token: t, login: localStorage.getItem(BLOG_USER_KEY) || "saved session" };
  } catch { /* storage unavailable */ }

  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem(BLOG_TOKEN_KEY) || ""; } catch { /* noop */ }
    if (saved) { unlock(saved); }
    else setStage("unlock");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openPost(p: GhFile) {
    setBusy(true); setErr(""); setOk(""); setMode("write");
    try {
      const raw = await readPost(token, p.path);
      const { fm, body } = parseFrontmatter(raw);
      setDraft({ isNew: false, slug: p.name.replace(/\.mdx$/, ""), path: p.path, sha: p.sha, title: fm.title ?? "", date: fm.date ?? todayISO(), description: fm.description ?? "", tags: parseTags(fm.tags), accent: fm.accent || "amber", author: typeof fm.author === "string" && fm.author.trim() ? fm.author.trim() : "hazem-alabiad", body });
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  function startNew() {
    setErr(""); setOk(""); setMode("write");
    setDraft({ ...EMPTY_DRAFT, date: todayISO() });
  }

  async function saveDraft() {
    if (!draft || !draft.title.trim()) { setErr("Title is required."); return; }
    const slug = draft.isNew ? slugify(draft.title) : draft.slug;
    if (draft.isNew && posts.some((p) => p.name === `${slug}.mdx`)) { setErr(`A post "${slug}.mdx" already exists.`); return; }
    const d = { ...draft, slug, path: draft.isNew ? `src/blog/posts/${slug}.mdx` : draft.path };
    setBusy(true); setErr(""); setOk("");
    try {
      await writePost(token, d.path, buildMdx(d), d.sha);
      setOk(`Saved ${d.path} — the site rebuilds on the next deploy.`);
      setDraft(null);
      await refresh(token);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  async function removePost(p: GhFile) {
    if (!confirm(`Delete "${p.name}" from the repo? This triggers a redeploy.`)) return;
    setBusy(true); setErr(""); setOk("");
    try {
      await deletePost(token, p.path, p.sha);
      setOk(`Deleted ${p.name}.`);
      if (draft?.path === p.path) setDraft(null);
      await refresh(token);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  const input = (v: string, on: (x: string) => void) => <input value={v} onChange={(e) => on(e.target.value)} style={FIELD} />;

  const qq = q.trim().toLowerCase();
  const visible = qq
    ? posts.filter((p) => {
        const slug = p.name.replace(/\.mdx$/, "");
        const m = POST_META.get(slug);
        return [p.name, slug, m?.title || "", m?.description || "", ...(m?.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(qq);
      })
    : posts;

  return (
    <div style={{ marginTop: 40 }}>
      {stage === "checking" && (
        <Panel title="BLOG ADMIN">
          <div style={{ ...MONO, fontSize: 12, color: "var(--ink-faint)", display: "flex", gap: 8, alignItems: "center" }}>
            <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> checking session…
          </div>
        </Panel>
      )}

      {stage === "unlock" && (
        <Panel title="BLOG ADMIN — UNLOCK">
          <div style={{ ...MONO, fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.7 }}>
            Post editing is restricted to authorized GitHub accounts. Enter a PAT with repo contents access — the account is checked against the blog author allow-list.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              value={token}
              placeholder="GitHub PAT"
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") unlock(token); }}
              style={{ ...FIELD, width: 260 }}
            />
            <button onClick={() => unlock(token)} disabled={busy} style={chipBtn("var(--violet)")}>
              <KeyRound size={12} /> {busy ? "CHECKING…" : "UNLOCK"}
            </button>
          </div>
          {authErr && <div style={{ ...MONO, fontSize: 11, color: "var(--red)" }}>✗ {authErr}</div>}
          {savedSession && (
            <div style={{ ...MONO, fontSize: 11, color: "var(--ink-faint)", marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <span>saved session as @{savedSession.login} — no token needed.</span>
              <button onClick={() => unlock(savedSession!.token)} disabled={busy} style={chipBtn("var(--sage)", true)}>
                <Lock size={12} /> RESUME
              </button>
            </div>
          )}
        </Panel>
      )}

      {stage === "ready" && user && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-faint)" }}>
            <span style={{ color: "var(--sage)" }}>✓ authenticated as @{user.login}</span>
            <button onClick={lock} style={chipBtn("var(--ink-dim)")}><Lock size={11} /> LOCK</button>
          </div>

          <Panel title="POSTS — live from the repo">
            <div style={{ ...MONO, fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.6 }}>
              Posts live as <b style={{ color: "var(--amber)" }}>.mdx</b> files in <b style={{ color: "var(--sage)" }}>src/blog/posts/</b>.
              Saving commits to <b style={{ color: "var(--ink)" }}>main</b> — GitHub Actions rebuilds Pages automatically.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--rule-soft)", borderRadius: 6, background: "var(--bg-elevated)", padding: "0 12px" }}>
              <Search size={14} color="var(--ink-faint)" style={{ flexShrink: 0 }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={`Search ${posts.length} post${posts.length === 1 ? "" : "s"} by title, slug, or tag…`}
                style={{ ...FIELD, border: "none", background: "transparent", paddingLeft: 0 }}
              />
            </div>
            {loading ? (
              <div style={{ ...MONO, fontSize: 12, color: "var(--ink-faint)", display: "flex", gap: 8, alignItems: "center" }}>
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> fetching posts…
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {visible.length === 0 && <div style={{ ...MONO, fontSize: 12, color: "var(--ink-faint)" }}>{qq ? `No posts match “${q.trim()}”.` : "No posts found in the repo."}</div>}
                {visible.map((p) => (
                  <div key={p.path} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid var(--rule-soft)", padding: "8px 12px", borderRadius: 6 }}>
                    <FileText size={13} color="var(--amber)" />
                    <span style={{ ...MONO, fontSize: 12.5, color: "var(--ink)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                    <button onClick={() => openPost(p)} disabled={busy} style={chipBtn("var(--sage)")}>EDIT</button>
                    <button onClick={() => removePost(p)} disabled={busy} style={chipBtn("var(--red)")}>DELETE</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={startNew} style={{ ...chipBtn("var(--amber)"), alignSelf: "flex-start" }}><Plus size={11} /> NEW POST</button>
          </Panel>

          {draft && (
            <Panel title={draft.isNew ? "NEW POST" : `EDITING · ${draft.path}`}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Label>SLUG {draft.isNew && <span style={{ opacity: 0.6 }}>— auto from title</span>}</Label>
                  {input(draft.slug, (s) => setDraft({ ...draft, slug: s }))}
                </div>
                <div>
                  <Label>DATE</Label>
                  {input(draft.date, (s) => setDraft({ ...draft, date: s }))}
                </div>
              </div>
              <div>
                <Label>TITLE</Label>
                {input(draft.title, (s) => setDraft({ ...draft, title: s }))}
              </div>
              <div>
                <Label>DESCRIPTION</Label>
                <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} style={FIELD} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Label>TAGS (comma-separated)</Label>
                  {input(draft.tags.join(", "), (s) => setDraft({ ...draft, tags: s.split(",").map((t) => t.trim()).filter(Boolean) }))}
                </div>
                <div>
                  <Label>AUTHOR — @username (links to LinkedIn)</Label>
                  {input(draft.author, (s) => setDraft({ ...draft, author: s }))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <Label>ACCENT</Label>
                  <select value={draft.accent} onChange={(e) => setDraft({ ...draft, accent: e.target.value })} style={FIELD}>
                    <option value="amber">amber</option>
                    <option value="sage">sage</option>
                    <option value="violet">violet</option>
                    <option value="pink">pink</option>
                  </select>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Label>BODY — MARKDOWN / MDX</Label>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setMode("write")} style={modeBtn(mode === "write")}>WRITE</button>
                    <button onClick={() => setMode("preview")} style={modeBtn(mode === "preview")}>PREVIEW</button>
                  </div>
                </div>
                {mode === "write" ? (
                  <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={14} style={FIELD} />
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
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button onClick={saveDraft} disabled={busy} style={chipBtn("var(--amber)", true)}>
                  <Save size={12} /> {draft.isNew ? "PUBLISH POST" : "SAVE POST"}
                </button>
                <button onClick={() => setDraft(null)} disabled={busy} style={chipBtn("var(--ink-dim)")}>CANCEL</button>
              </div>
            </Panel>
          )}

          {err && <div style={{ ...MONO, fontSize: 11, color: "var(--red)", marginBottom: 16 }}>✗ {err}</div>}
          {ok && <div style={{ ...MONO, fontSize: 11, color: "var(--sage)", marginBottom: 16 }}>✓ {ok}</div>}
        </>
      )}
    </div>
  );
}
