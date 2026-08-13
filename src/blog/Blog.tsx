import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Pencil, Plus, Search, Share2, Trash2, X } from "lucide-react";
import { posts, type Post } from "./posts";
import { readViews, trackView, type ViewsMap } from "./analytics";
import { AdUnit } from "../Adsense";
import { listPosts, readPost, writePost, deletePost, slugify, POSTS_DIR } from "../github";
import {
  verifyToken, saveBlogSession, loadBlogSession, clearBlogSession,
  parseFrontmatter, parseTags, buildMdx, EditorPanel,
  chipBtn, FIELD, MONO, EMPTY_DRAFT, type BlogDraft,
} from "./editor";
import { OWNER_LOGIN } from "./authors";

const FONT_SCALE_KEY = "hazem_font_scale";
const FONT_SIZES = [16, 18, 20, 22];

const profileUrl = (username: string) => `https://linkedin.com/in/${username}`;
const shareUrl = (slug: string) => `${location.origin}${location.pathname}#/blog/${slug}`;
const authorOf = (p: Post) => (p.author && p.author.trim()) || "hazem-alabiad";

function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function relDate(iso: string): string {
  if (!iso) return "";
  try {
    const days = Math.round((Date.now() - new Date(iso).getTime()) / 864e5);
    if (days < 1) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.round(days / 7)} weeks ago`;
    if (days < 365) return `${Math.round(days / 30)} months ago`;
    return `${Math.round(days / 365)} years ago`;
  } catch {
    return "";
  }
}

export function BlogIndex({ onOpen }: { onOpen: (slug: string) => void }) {
  const [views] = useState(readViews);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = q.trim().toLowerCase();

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
        .catch(() => { clearBlogSession(); });
    }
  }, []);

  async function unlock(v: string) {
    if (!v.trim()) return;
    setAuthBusy(true); setAuthErr("");
    try {
      const u = await verifyToken(v);
      saveBlogSession(v, u.login);
      setMgr({ login: u.login }); setToken(v); setUnlockOpen(false); setPat("");
    } catch (e) { setAuthErr((e as Error).message); }
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

  const score = (p: Post): number => {
    if (!query) return 0;
    const t = p.title.toLowerCase().includes(query) ? 4 : 0;
    const d = p.description.toLowerCase().includes(query) ? 2 : 0;
    const tg = p.tags.some((x) => x.toLowerCase().includes(query)) ? 2 : 0;
    const sl = p.slug.includes(query) ? 1 : 0;
    return t + d + tg + sl;
  };
  const hits = posts
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p);

  const highlight = (text: string): ReactNode => {
    if (!query) return text;
    const i = text.toLowerCase().indexOf(query);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <mark className="blog-search-hit">{text.slice(i, i + query.length)}</mark>
        {text.slice(i + query.length)}
      </>
    );
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + hits.length) % hits.length); }
    else if (e.key === "Enter" && active >= 0) { onOpen(hits[active].slug); }
  };

  const shown = query ? hits : posts;

  return (
    <section className="blog" id="blog">
      <div className="wrap">
        <div className="section-head reveal in">
          <div className="section-title-row">
            <span className="section-icon-badge" style={{ fontSize: 22 }}>✎</span>
            <h2 className="section-title">Notes &amp; <em>Ideas</em></h2>
          </div>
          <p className="blog-lede">Writing on NLP research, language engineering, and the craft of shipping software. {posts.length} post{posts.length === 1 ? "" : "s"}.</p>
        </div>
        <div className="blog-toolbar">
          <div className="blog-search">
            <Search size={15} className="blog-search-ic" />
            <input
              ref={inputRef}
              className="blog-search-input"
              placeholder="Search the blog — title, tag, or topic…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(-1); }}
              onKeyDown={onKey}
              aria-label="Search the blog"
            />
            {q && <button className="blog-search-clear" onClick={() => { setQ(""); setActive(-1); inputRef.current?.focus(); }} aria-label="Clear search"><X size={13} /></button>}
          </div>
          <div className="blog-manage">
            {mgr ? (
              <>
                <span className="blog-manage-user">✓ @{mgr.login}</span>
                <button className="blog-manage-btn blog-manage-btn--add" onClick={startNew}><Plus size={12} /> NEW POST</button>
                <button className="blog-manage-btn" onClick={lock}>LOCK</button>
              </>
            ) : (
              <button className="blog-manage-btn" onClick={() => setUnlockOpen((o) => !o)}><Pencil size={12} /> MANAGE</button>
            )}
          </div>
        </div>
        {unlockOpen && !mgr && (
          <div className="blog-unlock">
            <div className="blog-unlock-inner">
              <p className="blog-unlock-hint">Only the site owner can manage posts. Paste a GitHub PAT with repo contents access — it is verified against @{OWNER_LOGIN}.</p>
              <div className="blog-unlock-row">
                <input type="password" value={pat} placeholder="GitHub PAT" onChange={(e) => setPat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") unlock(pat); }} style={{ ...FIELD, flex: 1 }} />
                <button onClick={() => unlock(pat)} disabled={authBusy} className="blog-manage-btn blog-manage-btn--add">{authBusy ? "CHECKING…" : "UNLOCK"}</button>
                <button onClick={() => setUnlockOpen(false)} className="blog-manage-btn">CANCEL</button>
              </div>
              {authErr && <p className="blog-mgr-err">✗ {authErr}</p>}
            </div>
          </div>
        )}
        {query && (
          <div className="blog-search-status">
            {hits.length === 0 ? "No posts match your search." : `${hits.length} match${hits.length === 1 ? "" : "es"}${active >= 0 ? ` — ${active + 1}/${hits.length} (↑↓ to navigate, ↵ to open)` : ""}`}
          </div>
        )}
        {mgrErr && <p className="blog-mgr-err">✗ {mgrErr}</p>}
        {mgrOk && <p className="blog-mgr-ok">✓ {mgrOk}</p>}
        {draft && (
          <EditorPanel
            draft={draft}
            onDraft={(d) => setDraft(d)}
            busy={publishing}
            onSave={saveDraft}
            onCancel={() => setDraft(null)}
          />
        )}
        <AdUnit slot="0123456789" className="ad-slot--top" />
        <div className="blog-list">
          {shown.map((p: Post, i) => (
            <article className={`blog-card blog-card--${p.accent || "amber"}${query && i === active ? " blog-card--active" : ""}`} key={p.slug} onClick={() => onOpen(p.slug)}>
              <div className="blog-card-top">
                <span className="blog-card-date">{fmtDate(p.date)} <span className="blog-card-rel">· {relDate(p.date)}</span></span>
                <span className="blog-card-views">{views[p.slug] || 0} views</span>
              </div>
              <h3>{highlight(p.title)}</h3>
              <p>{highlight(p.description)}</p>
              <div className="blog-card-tags">{p.tags.map((t) => <span key={t}>{highlight(`#${t}`)}</span>)}</div>
              <div className="blog-card-foot">
                <a className="blog-card-author" href={profileUrl(authorOf(p))} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>✍ @{authorOf(p)}</a>
                <div className="blog-card-actions">
                  {mgr && (
                    <>
                      <button className="blog-card-manage" title="Edit post" onClick={(e) => { e.stopPropagation(); openForEdit(p); }}><Pencil size={12} /> EDIT</button>
                      <button className="blog-card-manage blog-card-manage--danger" title="Delete post" onClick={(e) => { e.stopPropagation(); removePost(p); }}><Trash2 size={12} /> DELETE</button>
                    </>
                  )}
                  <span className="blog-card-more">read →</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function BlogPost({ slug, onBack }: { slug: string; onBack: () => void }) {
  const post = posts.find((p) => p.slug === slug);
  const [views, setViews] = useState<ViewsMap>(readViews);
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState(() => {
    try {
      const v = parseInt(localStorage.getItem(FONT_SCALE_KEY) || "", 10);
      return FONT_SIZES.includes(v) ? v : 18;
    } catch { return 18; }
  });
  useEffect(() => {
    if (post) setViews(trackView(`post:${post.slug}`));
  }, [slug]);

  useEffect(() => {
    const prose = document.querySelector(".blog-prose");
    if (!prose) return;
    prose.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".blog-copy")) return;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "blog-copy";
      btn.textContent = "copy";
      btn.title = "Copy code";
      btn.addEventListener("click", () => {
        try {
          navigator.clipboard.writeText(pre.textContent || "").then(() => {
            btn.textContent = "copied";
            setTimeout(() => { btn.textContent = "copy"; }, 1600);
          });
        } catch { /* clipboard unavailable */ }
      });
      pre.appendChild(btn);
    });
  }, [slug, size]);
  if (!post) {
    return (
      <section className="blog" id="blog">
        <div className="wrap">
          <div className="blog-missing">
            <h2>Post not found</h2>
            <button className="btn" onClick={onBack}>← back to notes</button>
          </div>
        </div>
      </section>
    );
  }
  const { Component, accent } = post;
  const idx = FONT_SIZES.indexOf(size);
  const setPersist = (next: number) => {
    try { localStorage.setItem(FONT_SCALE_KEY, String(next)); } catch { /* ignore */ }
    setSize(next);
  };
  const author = authorOf(post);
  const copyLink = async () => {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1800); };
    try {
      await navigator.clipboard.writeText(shareUrl(post.slug));
    } catch { /* clipboard unavailable */ }
    done();
  };
  return (
    <section className={`blog blog-post blog-post--${accent || "amber"}`} id="blog">
      <div className="wrap">
        <button className="btn blog-back" onClick={onBack}>← all notes</button>
        <article className="blog-article">
          <div className="blog-article-meta">
            <span className="blog-article-date">{fmtDate(post.date)}</span>
            <span className="blog-article-dot">·</span>
            <span className="blog-article-rel">{relDate(post.date)}</span>
            <span className="blog-article-dot">·</span>
            <span className="blog-article-tags">{post.tags.map((t) => <span key={t}>#{t}</span>)}</span>
            <span className="blog-article-dot">·</span>
            <span className="blog-article-views">{views[`post:${post.slug}`] || 0} views</span>
          </div>
          <div className="blog-article-by">
            <span className="blog-article-author">written by <a href={profileUrl(author)} target="_blank" rel="noopener noreferrer">@{author}</a></span>
          </div>
          <div className="blog-article-tools">
            <button className="blog-size-btn blog-share-btn" onClick={copyLink} title="Copy link to this post">{copied ? <Check size={13} /> : <Share2 size={13} />}</button>
            <button className="blog-size-btn" onClick={() => idx > 0 && setPersist(FONT_SIZES[idx - 1])} disabled={idx <= 0} title="Smaller text">A−</button>
            <button className="blog-size-btn" onClick={() => idx < FONT_SIZES.length - 1 && setPersist(FONT_SIZES[idx + 1])} disabled={idx >= FONT_SIZES.length - 1} title="Larger text">A+</button>
          </div>
          <h1>{post.title}</h1>
          <p className="blog-article-desc">{post.description}</p>
          <div className="blog-prose" style={{ fontSize: size, ["--prose-scale" as string]: (size / 17).toFixed(3) }}>
            <Component />
          </div>
          <div className="blog-article-foot">
            <span>Thanks for reading — feedback welcome.</span>
          </div>
        </article>
        <AdUnit slot="0123456789" />
      </div>
    </section>
  );
}
