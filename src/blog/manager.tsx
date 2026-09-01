import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { posts, type Post } from "./posts";
import { GH_BRANCH, getFileSha, readPost, writePost, deletePost, slugify, POSTS_DIR } from "../github";
import {
  verifyToken, saveBlogSession, loadBlogSession, clearBlogSession, sanitizeToken,
  parseFrontmatter, parseTags, buildMdx, EMPTY_DRAFT, type BlogDraft,
} from "./editor";
import { OWNER_LOGIN } from "./authors";

interface BlogManagerValue {
  mgr: { login: string } | null;
  token: string | null;
  unlockOpen: boolean;
  setUnlockOpen: (v: boolean) => void;
  pat: string;
  setPat: (v: string) => void;
  unlock: (v: string) => Promise<void>;
  /** Silent re-unlock using the stored token — true when still valid, false when none/invalid (UI should ask for a fresh one). */
  restore: () => Promise<boolean>;
  lock: () => void;
  draft: BlogDraft | null;
  setDraft: (d: BlogDraft | null) => void;
  publishing: boolean;
  mgrErr: string;
  mgrOk: string;
  authBusy: boolean;
  authErr: string;
  hiddenSlugs: Set<string>;
  visiblePosts: Post[];
  startNew: () => void;
  openForEdit: (p: Post) => Promise<void>;
  saveDraft: () => Promise<void>;
  removePost: (p: Post) => Promise<void>;
}

const BlogManagerContext = createContext<BlogManagerValue | null>(null);

export function useBlogManager(): BlogManagerValue {
  const ctx = useContext(BlogManagerContext);
  if (!ctx) throw new Error("useBlogManager must be used within BlogManagerProvider");
  return ctx;
}

export function BlogManagerProvider({ children }: { children: ReactNode }) {
  const [mgr, setMgr] = useState<{ login: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [pat, setPat] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authErr, setAuthErr] = useState("");
  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [mgrErr, setMgrErr] = useState("");
  const [mgrOk, setMgrOk] = useState("");
  const [hiddenSlugs, setHiddenSlugs] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("hazem-hidden-posts") || "[]")); } catch { return new Set(); }
  });
  const visiblePosts = posts.filter((p) => !hiddenSlugs.has(p.slug));

  useEffect(() => {
    const saved = loadBlogSession();
    if (saved) {
      verifyToken(saved.token)
        .then((u) => { setMgr({ login: u.login }); setToken(saved.token); })
        .catch(() => clearBlogSession());
      return;
    }
    // migrate legacy CMS token (hazem-cms-token) if present
    try {
      const legacy = localStorage.getItem("hazem-cms-token");
      if (legacy) {
        verifyToken(legacy)
          .then((u) => {
            saveBlogSession(legacy, u.login);
            localStorage.removeItem("hazem-cms-token");
            setMgr({ login: u.login }); setToken(legacy);
          })
          .catch(() => { try { localStorage.removeItem("hazem-cms-token"); } catch { /* noop */ } });
      }
    } catch { /* storage unavailable */ }
  }, []);

  async function unlock(v: string) {
    const value = sanitizeToken(v);
    if (!value) throw new Error("Token is empty.");
    setAuthBusy(true); setAuthErr("");
    try {
      const u = await verifyToken(value);
      saveBlogSession(value, u.login);
      setMgr({ login: u.login }); setToken(value); setUnlockOpen(false); setPat("");
    } catch (e) { const msg = (e as Error).message; setAuthErr(msg); throw e; }
    finally { setAuthBusy(false); }
  }

  // LOCK only disables editing — the token stays stored (localStorage + memory)
  // so the user is never asked to re-enter it. Only removing it from
  // localStorage (or an invalid token being cleared on next verify) fully logs out.
  function lock() {
    setMgr(null); setDraft(null); setMgrErr(""); setMgrOk(""); setUnlockOpen(false);
  }

  // Clicking CMS after a lock silently re-verifies the token that is still
  // stored (memory first, then localStorage) instead of asking for it again.
  // Returns false when there is no stored token or it was revoked — the UI
  // then falls back to the token entry panel.
  async function restore(): Promise<boolean> {
    const saved = (() => { try { return loadBlogSession(); } catch { return null; } })();
    const stored = token || saved?.token || null;
    if (!stored) return false;
    try {
      const u = await verifyToken(stored);
      saveBlogSession(stored, u.login);
      setMgr({ login: u.login }); setToken(stored);
      return true;
    } catch {
      // token removed or revoked — drop it so we ask for a fresh one
      clearBlogSession(); setToken(null);
      return false;
    }
  }

  function startNew() {
    setMgrErr(""); setMgrOk("");
    setDraft({ ...EMPTY_DRAFT });
  }

  async function openForEdit(p: Post) {
    if (!token) { setMgrErr("Not authenticated — unlock with your PAT first."); return; }
    setMgrErr(""); setMgrOk("");
    try {
      const raw = await readPost(token, `${POSTS_DIR}/${p.slug}.mdx`);
      const { fm, body } = parseFrontmatter(raw);
      setDraft({ isNew: false, slug: p.slug, path: `${POSTS_DIR}/${p.slug}.mdx`, title: fm.title ?? p.title, date: fm.date ?? p.date, description: fm.description ?? p.description, tags: fm.tags ? parseTags(fm.tags) : p.tags, accent: p.accent || "amber", author: OWNER_LOGIN, body });
    } catch (e) { const msg = (e as any)?.message || String(e); setMgrErr(msg); }
  }

  async function saveDraft() {
    if (!token) { setMgrErr("Not authenticated — unlock with your PAT first."); return; }
    if (!draft) return;
    if (!draft.title.trim()) { setMgrErr("Title is required."); return; }
    const slug = draft.isNew ? slugify(draft.title) : draft.slug;
    const d = { ...draft, slug, path: draft.isNew ? `${POSTS_DIR}/${slug}.mdx` : draft.path };
    setPublishing(true); setMgrErr(""); setMgrOk("");
    try {
      await writePost(token, d.path, buildMdx(d), d.sha);
      setMgrOk(`Saved ${d.path} — the site rebuilds on the next deploy.`);
      setDraft(null);
    } catch (e) { const msg = (e as any)?.message || String(e); setMgrErr(msg); }
    finally { setPublishing(false); }
  }

  async function removePost(p: Post) {
    if (!token) { setMgrErr("Not authenticated — unlock with your PAT first."); return; }
    const path = `${POSTS_DIR}/${p.slug}.mdx`;
    if (!confirm(`Delete "${p.slug}.mdx" from the repo? This triggers a redeploy.`)) return;
    setPublishing(true); setMgrErr(""); setMgrOk("");
    try {
      const sha = await getFileSha(token, path);
      if (!sha) throw new Error(`Could not find ${path} on the ${GH_BRANCH} branch. The post may not have been pushed to the repo yet.`);
      await deletePost(token, path, sha);
      // optimistic hide: commit to main triggers deploy workflow (on.push.main) automatically — no manual trigger needed, but hide instantly
      setHiddenSlugs((prev) => {
        const next = new Set(prev); next.add(p.slug);
        try { localStorage.setItem("hazem-hidden-posts", JSON.stringify([...next])); } catch { /* ignore */ }
        return next;
      });
      setMgrOk(`Deleted ${p.slug}.mdx — commit pushed to ${GH_BRANCH}, Pages is rebuilding now (takes ~1-2 min). The post is hidden locally and will disappear for everyone after deploy.`);
      if (draft?.path === path) setDraft(null);
    } catch (e) { const msg = (e as any)?.message || String(e); setMgrErr(`Delete failed: ${msg} — check that your PAT has 'repo' (contents:write) scope and that the file still exists.`); }
    finally { setPublishing(false); }
  }

  const value: BlogManagerValue = {
    mgr, token, unlockOpen, setUnlockOpen, pat, setPat, unlock, restore, lock,
    draft, setDraft, publishing, mgrErr, mgrOk, authBusy, authErr,
    hiddenSlugs, visiblePosts,
    startNew, openForEdit, saveDraft, removePost,
  };

  return <BlogManagerContext.Provider value={value}>{children}</BlogManagerContext.Provider>;
}

export { posts };