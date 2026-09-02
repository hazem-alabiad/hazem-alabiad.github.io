import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBlogManager } from "./manager";
import { FIELD, EMPTY_DRAFT, type BlogDraft } from "./editor";
import { slugify, POSTS_DIR } from "../github";
import { EditorPanel } from "./editor-panel";
import { OWNER_LOGIN } from "./authors";

/**
 * Full-page editor for a single blog post.
 *
 * /blog/admin/new          → create a fresh post
 * /blog/admin/edit/:slug   → load that post from the repo and edit it
 *
 * The editor owns its draft locally; saving goes through the shared
 * BlogManager so the token/session stays in one place.
 */
export function PostEditorPage({ mode }: { mode: "new" | "edit" }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const {
    mgr, token, restore,
    pat, setPat, unlock,
    publishDraft, loadPostDraft, publishing,
    mgrErr, mgrOk, authBusy, authErr,
  } = useBlogManager();
  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState("");

  // If a session is saved (e.g. unlocked in the admin screen), resume it
  // silently so the editor never asks for a PAT that already exists.
  useEffect(() => {
    restore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    if (mode === "new") {
      setLoadErr("");
      setDraft({ ...EMPTY_DRAFT });
      return;
    }
    if (!token || !slug) return;
    setLoading(true); setLoadErr("");
    loadPostDraft(slug)
      .then((d) => { if (!cancelled) setDraft(d); })
      .catch((e) => { if (!cancelled) setLoadErr((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mode, slug, token]);

  const backTo = mode === "edit" && slug ? `/blog/${slug}` : "/blog";

  async function onSave() {
    if (!draft) return;
    try {
      const slug = mode === "new" ? slugify(draft.title) : draft.slug;
      const final: BlogDraft = slug ? { ...draft, slug, path: draft.isNew ? `${POSTS_DIR}/${slug}.mdx` : draft.path } : draft;
      await publishDraft(final);
      navigate(slug ? `/blog/${slug}` : "/blog", { replace: true });
    } catch { /* mgrErr already set by publishDraft */ }
  }

  return (
    <section className="blog" id="blog">
      <div className="wrap">
        <button className="btn blog-back" onClick={() => navigate(backTo)}>← all notes</button>
        <div className="blog-editor-head">
          <span className="blog-editor-kicker">{mode === "edit" ? `EDITING · ${slug}` : "NEW POST · WRITE A NOTE"}</span>
        </div>
        {!mgr ? (
          <div className="blog-unlock">
            <div className="blog-unlock-inner">
              <p className="blog-unlock-hint">Only the site owner can manage posts. Paste a GitHub PAT with repo contents access; it is verified against @{OWNER_LOGIN}.</p>
              <div className="blog-unlock-row">
                <input type="password" value={pat} placeholder="GitHub PAT" aria-label="GitHub personal access token" autoComplete="new-password" spellCheck={false} autoCapitalize="off" autoCorrect="off" onChange={(e) => setPat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") unlock(pat); }} style={{ ...FIELD, flex: 1 }} />
                <button onClick={() => unlock(pat)} disabled={authBusy} className="blog-manage-btn blog-manage-btn--add">{authBusy ? "CHECKING…" : "UNLOCK"}</button>
                <button onClick={() => navigate("/blog")} className="blog-manage-btn">CANCEL</button>
              </div>
              {authErr && <p className="blog-mgr-err">✗ {authErr}</p>}
            </div>
          </div>
        ) : loading ? (
          <p className="blog-mgr-ok">Loading post…</p>
        ) : loadErr ? (
          <div className="blog-missing">
            <h2>Could not load this post</h2>
            <p className="blog-empty-hint">{loadErr}</p>
            <button className="btn" onClick={() => navigate("/blog")}>← back to notes</button>
          </div>
        ) : draft ? (
          <EditorPanel
            draft={draft}
            onDraft={setDraft}
            busy={publishing}
            onSave={onSave}
            onCancel={() => navigate(backTo)}
          />
        ) : null}
        {mgrErr && <p className="blog-mgr-err">✗ {mgrErr}</p>}
        {mgrOk && <p className="blog-mgr-ok">✓ {mgrOk}</p>}
      </div>
    </section>
  );
}
