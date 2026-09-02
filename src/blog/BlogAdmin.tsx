import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, Lock, FileText, KeyRound, Search } from "lucide-react";
import { listPosts, deletePost } from "../github";
import {
  verifyToken, saveBlogSession, loadBlogSession, sanitizeToken,
  Panel, chipBtn, FIELD, MONO,
} from "./editor";
import { type BlogAuthorUser } from "./authors";
import { posts } from "./posts";
import { POSTS_DIR } from "../github";

const POST_META = new Map<string, { title: string; description: string; tags: string[] }>();
for (const p of posts) POST_META.set(p.slug, { title: p.title, description: p.description, tags: p.tags });

export default function BlogAdmin() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<"checking" | "unlock" | "ready">("checking");
  const [user, setUser] = useState<BlogAuthorUser | null>(null);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [authErr, setAuthErr] = useState("");

  const [filePosts, setFilePosts] = useState<Awaited<ReturnType<typeof listPosts>>>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [q, setQ] = useState("");

  async function refresh(activeToken: string) {
    setLoading(true); setErr("");
    try { setFilePosts(await listPosts(activeToken)); }
    catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  async function unlock(value: string) {
    const token = sanitizeToken(value);
    if (!token) return;
    setBusy(true); setAuthErr("");
    try {
      const u = await verifyToken(token);
      saveBlogSession(token, u.login);
      setUser(u); setToken(token); setStage("ready");
      refresh(token);
    } catch (e) { setAuthErr((e as Error).message); }
    finally { setBusy(false); }
  }

  // LOCK only deactivates editing — the token stays stored in localStorage,
  // so RESUME on the unlock screen silently re-verifies instead of asking for
  // it again. Only removing hazem-blog-token from localStorage fully logs out.
  function lock() {
    setUser(null); setToken(""); setStage("unlock");
  }

  const savedSession = loadBlogSession();

  useEffect(() => {
    const saved = loadBlogSession();
    if (saved) unlock(saved.token);
    else setStage("unlock");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function removePost(p: { path: string; name: string; sha: string }) {
    if (!confirm(`Delete "${p.name}" from the repo? This triggers a redeploy.`)) return;
    setBusy(true); setErr(""); setOk("");
    try {
      await deletePost(token, p.path, p.sha);
      setOk(`Deleted ${p.name}.`);
      await refresh(token);
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  const qq = q.trim().toLowerCase();
  const visible = qq
    ? filePosts.filter((p) => {
        const slug = p.name.replace(/\.mdx$/, "");
        const m = POST_META.get(slug);
        return [p.name, slug, m?.title || "", m?.description || "", ...(m?.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(qq);
      })
    : filePosts;

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
        <Panel title="BLOG ADMIN · UNLOCK">
          <div style={{ ...MONO, fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.7 }}>
            Post editing is restricted to the site owner. Enter a PAT with repo contents access; the account is checked against the owner GitHub account.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="password"
              value={token}
              placeholder="GitHub PAT"
              aria-label="GitHub personal access token"
              autoComplete="new-password"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
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
              <span>saved session as @{savedSession.login} · no token needed.</span>
              <button onClick={() => unlock(savedSession.token)} disabled={busy} style={chipBtn("var(--sage)", true)}>
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

          <Panel title="POSTS · live from the repo">
            <div style={{ ...MONO, fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.6 }}>
              Posts live as <b style={{ color: "var(--amber)" }}>.mdx</b> files in <b style={{ color: "var(--sage)" }}>{POSTS_DIR}/</b>.
              Saving commits to <b style={{ color: "var(--ink)" }}>main</b> · GitHub Actions rebuilds Pages automatically.
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
                    <button onClick={() => navigate(`/blog/admin/edit/${p.name.replace(/\.mdx$/, "")}`)} disabled={busy} style={chipBtn("var(--sage)")}>EDIT</button>
                    <button onClick={() => removePost(p)} disabled={busy} style={chipBtn("var(--red)")}>DELETE</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => navigate("/blog/admin/new")} style={{ ...chipBtn("var(--amber)"), alignSelf: "flex-start" }}><Plus size={11} /> NEW POST</button>
          </Panel>

          {err && <div style={{ ...MONO, fontSize: 11, color: "var(--red)", marginBottom: 16 }}>✗ {err}</div>}
          {ok && <div style={{ ...MONO, fontSize: 11, color: "var(--sage)", marginBottom: 16 }}>✓ {ok}</div>}
        </>
      )}
    </div>
  );
}