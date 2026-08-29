import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { posts, type Post } from "./posts";
import { listPosts, readPost, writePost, deletePost, slugify, POSTS_DIR } from "../github";
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
  lock: () => void;
  draft: BlogDraft | null;
  setDraft: (d: BlogDraft | null) => void;
  publishing: boolean;
  mgrErr: string;
  mgrOk: string;
  authBusy: boolean;
  authErr: string;
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

  function lock() {
    clearBlogSession();
    setMgr(null); setToken(null); setDraft(null); setMgrErr(""); setMgrOk("");
  }

  function startNew() {
    setMgrErr(""); setMgrOk("");
    setDraft({ ...EMPTY_DRAFT });
  }

  async function openForEdit(p: Post) {
    if (!token) return;
    setMgrErr(""); setMgrOk("");
    try {
      const raw = await readPost(token, `${POSTS_DIR}/${p.slug}.mdx`);
      const { fm, body } = parseFrontmatter(raw);
      setDraft({ isNew: false, slug: p.slug, path: `${POSTS_DIR}/${p.slug}.mdx`, title: fm.title ?? p.title, date: fm.date ?? p.date, description: fm.description ?? p.description, tags: fm.tags ? parseTags(fm.tags) : p.tags, accent: p.accent || "amber", author: OWNER_LOGIN, body });
    } catch (e) { setMgrErr((e as Error).message); }
  }

  async function saveDraft() {
    if (!token || !draft) return;
    if (!draft.title.trim()) { setMgrErr("Title is required."); return; }
    const slug = draft.isNew ? slugify(draft.title) : draft.slug;
    const d = { ...draft, slug, path: draft.isNew ? `${POSTS_DIR}/${slug}.mdx` : draft.path };
    setPublishing(true); setMgrErr(""); setMgrOk("");
    try {
      await writePost(token, d.path, buildMdx(d), d.sha);
      setMgrOk(`Saved ${d.path} — the site rebuilds on the next deploy.`);
      setDraft(null);
    } catch (e) { setMgrErr((e as Error).message); }
    finally { setPublishing(false); }
  }

  async function removePost(p: Post) {
    if (!token) return;
    const path = `${POSTS_DIR}/${p.slug}.mdx`;
    if (!confirm(`Delete "${p.slug}.mdx" from the repo? This triggers a redeploy.`)) return;
    setPublishing(true); setMgrErr(""); setMgrOk("");
    try {
      const files = await listPosts(token);
      const f = files.find((x) => x.path === path);
      if (!f) throw new Error(`Could not find ${path} in the repo (has it been deployed?).`);
      await deletePost(token, path, f.sha);
      setMgrOk(`Deleted ${p.slug}.mdx.`);
      if (draft?.path === path) setDraft(null);
    } catch (e) { setMgrErr((e as Error).message); }
    finally { setPublishing(false); }
  }

  const value: BlogManagerValue = {
    mgr, token, unlockOpen, setUnlockOpen, pat, setPat, unlock, lock,
    draft, setDraft, publishing, mgrErr, mgrOk, authBusy, authErr,
    startNew, openForEdit, saveDraft, removePost,
  };

  return <BlogManagerContext.Provider value={value}>{children}</BlogManagerContext.Provider>;
}

export { posts };