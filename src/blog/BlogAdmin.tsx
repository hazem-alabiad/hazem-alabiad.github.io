import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Plus, Trash2, Save, Loader2, Lock, FileText, KeyRound } from "lucide-react";
import { listPosts, readPost, writePost, deletePost, slugify, todayISO, type GhFile } from "../github";
import { isAuthorized, type BlogAuthorUser } from "./authors";

const BLOG_TOKEN_KEY = "hazem-blog-token";

const MONO: CSSProperties = { fontFamily: "var(--font-mono)" };
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
  body: string;
}

const EMPTY_DRAFT: BlogDraft = { isNew: true, slug: "", path: "", title: "", date: todayISO(), description: "", tags: [], accent: "amber", body: "" };

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
  if (d.tags.length) lines.push(`tags: [${d.tags.map((t) => `"${esc(t)}"`).join(", ")}]`);
  if (d.accent) lines.push(`accent: "${d.accent}"`);
  lines.push("---", "");
  return lines.join("\n") + d.body.trim() + "\n";
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
      try { localStorage.setItem(BLOG_TOKEN_KEY, value); } catch { /* storage unavailable */ }
      setUser(u); setToken(value); setStage("ready");
      refresh(value);
    } catch (e) { setAuthErr((e as Error).message); }
    finally { setBusy(false); }
  }

  function lock() {
    try { localStorage.removeItem(BLOG_TOKEN_KEY); } catch { /* noop */ }
    setUser(null); setToken(""); setDraft(null); setStage("unlock");
  }

  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem(BLOG_TOKEN_KEY) || ""; } catch { /* noop */ }
    if (saved) { unlock(saved); }
    else setStage("unlock");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openPost(p: GhFile) {
    setBusy(true); setErr(""); setOk("");
    try {
      const raw = await readPost(token, p.path);
      const { fm, body } = parseFrontmatter(raw);
      setDraft({ isNew: false, slug: p.name.replace(/\.mdx$/, ""), path: p.path, sha: p.sha, title: fm.title ?? "", date: fm.date ?? todayISO(), description: fm.description ?? "", tags: parseTags(fm.tags), accent: fm.accent || "amber", body });
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  function startNew() {
    setErr(""); setOk("");
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
            {loading ? (
              <div style={{ ...MONO, fontSize: 12, color: "var(--ink-faint)", display: "flex", gap: 8, alignItems: "center" }}>
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> fetching posts…
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {posts.length === 0 && <div style={{ ...MONO, fontSize: 12, color: "var(--ink-faint)" }}>No posts found in the repo.</div>}
                {posts.map((p) => (
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
                <Label>BODY — MARKDOWN / MDX</Label>
                <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={14} style={FIELD} />
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
