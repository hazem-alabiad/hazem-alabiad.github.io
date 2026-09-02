import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBlogManager } from "./manager";
import { FIELD, EMPTY_DRAFT, type BlogDraft } from "./editor";
import { slugify, POSTS_DIR } from "../github";
import { EditorPanel, type SaveState } from "./editor-panel";
import "../styles/editor-full-space.css";

// local-draft autosave: composition is persisted to localStorage (debounced)
// so an interrupted session resumes; the repo only changes on explicit publish.
const draftKey = (slug: string) => `hazem_draft_${slug || "new"}`;
const readLocalDraft = (slug: string): Partial<BlogDraft> | null => {
  try {
    const raw = localStorage.getItem(draftKey(slug));
    return raw ? (JSON.parse(raw) as Partial<BlogDraft>) : null;
  } catch { return null; }
};
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
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const dirty = useRef(false);

  // If a session is saved (e.g. unlocked in the admin screen), resume it
  // silently so the editor never asks for a PAT that already exists.
  useEffect(() => {
    restore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    if (mode === "new") {
      setLoadErr("");
      // resume an interrupted composition when one exists
      const local = readLocalDraft("new");
      setDraft(local && (local.title || local.body)
        ? { ...EMPTY_DRAFT, title: local.title || "", description: local.description || "", date: local.date || EMPTY_DRAFT.date, tags: local.tags || [], body: local.body || "" }
        : { ...EMPTY_DRAFT });
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

  // debounced local autosave — “saving / saved locally / failed” chip
  useEffect(() => {
    if (!draft || !dirty.current) return;
    setSaveState("saving");
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey(draft.isNew ? "new" : draft.slug), JSON.stringify({ title: draft.title, description: draft.description, date: draft.date, tags: draft.tags, body: draft.body }));
        setSaveState("saved");
      } catch { setSaveState("error"); }
    }, 800);
    return () => window.clearTimeout(t);
  }, [draft]);

  async function onSave() {
    if (!draft) return;
    try {
      const slug = mode === "new" ? slugify(draft.title) : draft.slug;
      const final: BlogDraft = slug ? { ...draft, slug, path: draft.isNew ? `${POSTS_DIR}/${slug}.mdx` : draft.path } : draft;
      await publishDraft(final);
      try {
        localStorage.removeItem(draftKey("new"));
        if (slug) localStorage.removeItem(draftKey(slug));
      } catch { /* ignore */ }
      navigate(slug ? `/blog/${slug}` : "/blog", { replace: true });
    } catch { /* mgrErr already set by publishDraft */ }
  }

  return (
    <section className="blog blog-editor-page" id="blog">
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
            onDraft={(d) => { dirty.current = true; setDraft(d); }}
            busy={publishing}
            saveState={saveState}
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
