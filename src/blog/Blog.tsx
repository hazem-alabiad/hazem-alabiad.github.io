import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Lock, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { Comments } from "./Comments";
import { posts, type Post } from "./posts";
import { readViews, trackView, type ViewsMap } from "./analytics";
import { AdUnit } from "../Adsense";
import { EditorPanel, FIELD } from "./editor";
import { useBlogManager } from "./manager";
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

export function BlogIndex({ onOpen }: { onOpen: (slug: string) => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = q.trim().toLowerCase();
  // single stray characters (e.g. the "/" focus shortcut) are not a search
  const searching = query.length >= 2;

  // Press "terminal-slash" anywhere on the page to jump into search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { mgr, unlockOpen, setUnlockOpen, pat, setPat, unlock, lock, draft, setDraft, publishing, mgrErr, mgrOk, authBusy, authErr, visiblePosts, startNew, openForEdit, saveDraft, removePost } = useBlogManager();

  const score = (p: Post): number => {
    if (!query) return 0;
    const t = p.title.toLowerCase().includes(query) ? 4 : 0;
    const d = p.description.toLowerCase().includes(query) ? 2 : 0;
    const tg = p.tags.some((x) => x.toLowerCase().includes(query)) ? 2 : 0;
    const sl = p.slug.includes(query) ? 1 : 0;
    return t + d + tg + sl;
  };
  const hits = visiblePosts
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
    if (e.key === "Escape") { setQ(""); setActive(-1); return; }
    if (!hits.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + hits.length) % hits.length); }
    else if (e.key === "Enter" && active >= 0) { onOpen(hits[active].slug); }
  };

  const shown = searching ? hits : visiblePosts;

  return (
    <section className="blog" id="blog">
      <div className="wrap">
        <div className="section-head reveal in">
          <div className="section-title-row">
            <span className="section-icon-badge" style={{ fontSize: 22 }}>✎</span>
            <h2 className="section-title">Notes &amp; <em>Ideas</em></h2>
          </div>
          <p className="blog-lede">Writing on NLP research, language engineering, and the craft of shipping software. {visiblePosts.length} post{visiblePosts.length === 1 ? "" : "s"}.</p>
        </div>
        <div className="blog-toolbar">
          <div className="blog-search-label"><span>SEARCH NOTES</span><small>title · tag · topic</small></div>
          <div className="blog-search">
            <span className="blog-search-prompt" aria-hidden="true">➜</span>
            <input
              ref={inputRef}
              className="blog-search-input"
              placeholder="grep the notes: title, tag, or topic"
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(-1); }}
              onKeyDown={onKey}
              aria-label="Search the blog"
            />
            {searching && hits.length > 0 && (
              <span className="blog-search-count" aria-live="polite">{hits.length} hit{hits.length === 1 ? "" : "s"}</span>
            )}
            {q
              ? <button className="blog-search-clear" onClick={() => { setQ(""); setActive(-1); inputRef.current?.focus(); }} aria-label="Clear search" title="Clear search (esc)"><kbd>esc</kbd></button>
              : <kbd className="blog-search-kbd" aria-hidden="true">/</kbd>}
          </div>
          <div className="blog-owner-row">
            <span className="blog-owner-caption">OWNER TOOLS</span>
            <div className="blog-manage" aria-label="Blog owner controls">
              {mgr ? (
                <>
                  <span className="blog-manage-label">OWNER</span>
                  <button className="blog-manage-btn blog-manage-btn--add" onClick={startNew} title="Create a new blog post"><Plus size={13} /><span>NEW POST</span></button>
                  <button className="blog-manage-btn" onClick={lock} title="Lock blog editing"><Lock size={13} /><span>LOCK</span></button>
                </>
              ) : (
                <button className="blog-lock-btn" onClick={() => setUnlockOpen(!unlockOpen)} title="Owner login — manage posts" aria-label="Owner login — manage posts"><Lock size={14} /></button>
              )}
            </div>
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
        {searching && hits.length > 0 && active >= 0 && (
          <div className="blog-search-status" role="status">
            {active + 1}/{hits.length} · ↑↓ navigate, ↵ open
          </div>
        )}
        {searching && hits.length === 0 && (
          <div className="blog-empty">
            <p className="blog-empty-title">No notes match “{q}”</p>
            <p className="blog-empty-hint">Try a different keyword, or browse all posts.</p>
            <button className="blog-manage-btn" onClick={() => { setQ(""); setActive(-1); inputRef.current?.focus(); }}>Clear search</button>
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
              {/* tier 1: date + read time */}
              <div className="blog-card-meta">
                <span className="blog-card-date">{fmtDate(p.date)}</span>
                <span className="blog-card-meta-sep" />
                <span className="blog-card-readtime">{Math.max(1, Math.round(p.description.split(/\s+/).length / 40))} min read</span>
              </div>
              {/* tier 2: title + description */}
              <h3 className="blog-card-title">{highlight(p.title)}</h3>
              <p className="blog-card-desc">{highlight(p.description)}</p>
              {/* tier 3: tags + footer */}
              <div className="blog-card-tags">{p.tags.map((t) => <span key={t}>{highlight(t)}</span>)}</div>
              <div className="blog-card-foot">
                <a className="blog-card-author" href={`https://github.com/${authorOf(p)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>@{authorOf(p)}</a>
                <div className="blog-card-actions">
                  {mgr && (
                    <>
                      <button className="blog-card-manage blog-card-manage--ionly" title="Edit post" aria-label={`Edit ${p.slug}`} onClick={(e) => { e.stopPropagation(); openForEdit(p); }}><Pencil size={12} /></button>
                      <button className="blog-card-manage blog-card-manage--danger blog-card-manage--ionly" title="Delete post" aria-label={`Delete ${p.slug}`} onClick={(e) => { e.stopPropagation(); removePost(p); }}><Trash2 size={12} /></button>
                    </>
                  )}
                  <span className="blog-card-more">Read &rarr;</span>
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
  const { hiddenSlugs } = useBlogManager();
  const post = hiddenSlugs.has(slug) ? undefined : posts.find((p) => p.slug === slug);
  const [views, setViews] = useState<ViewsMap>(readViews);
  const [copied, setCopied] = useState(false);
  const [size, setSize] = useState(() => {
    try {
      const v = parseInt(localStorage.getItem(FONT_SCALE_KEY) || "", 10);
      return FONT_SIZES.includes(v) ? v : 18;
    } catch { return 18; }
  });
  const { mgr, lock, unlockOpen, setUnlockOpen, pat, setPat, unlock, openForEdit, removePost, draft, mgrErr, mgrOk, publishing, saveDraft, setDraft, authBusy, authErr } = useBlogManager();
  const [readingTime, setReadingTime] = useState<number | null>(null);

  useEffect(() => {
    if (post) setViews(trackView(`post:${post.slug}`));
  }, [slug]);

  useEffect(() => {
    // compute reading time from rendered prose text after mount
    const prose = document.querySelector(".blog-prose");
    if (!prose) return;
    const words = (prose.textContent || "").trim().split(/\s+/).filter(Boolean).length;
    setReadingTime(Math.max(1, Math.round(words / 200)));
  }, [slug, size]);

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
          {/* ── header ── */}
          <div className="blog-article-header">
            <div className="blog-article-tags">
              {post.tags.map((t) => <span key={t} className={`blog-article-tag blog-article-tag--${accent || "amber"}`}>#{t}</span>)}
            </div>
            <div className="blog-article-toolbar">
              {mgr ? (
                <>
                  <button className="blog-size-btn blog-post-manage" title="Edit this post" onClick={() => openForEdit(post)}><Pencil size={12} /> EDIT</button>
                  <button className="blog-size-btn blog-post-manage blog-post-manage--danger" title="Delete this post" onClick={() => { if (removePost) removePost(post); }}><Trash2 size={12} /> DELETE</button>
                  <button className="blog-size-btn blog-post-manage" title="Lock management" onClick={() => lock()}><Lock size={12} /> LOCK</button>
                </>
              ) : (
                <button className="blog-size-btn blog-lock-btn" title="Owner login" aria-label="Owner login" onClick={() => setUnlockOpen(!unlockOpen)}><Lock size={13} /></button>
              )}
              <button className="blog-size-btn blog-share-btn" onClick={copyLink} title="Copy link" aria-label="Copy link">
                {copied ? <><Check size={13} /> COPIED</> : <><Share2 size={13} /> SHARE</>}
              </button>
              <div className="blog-size-group" role="group" aria-label="Text size">
                <button className="blog-size-btn" onClick={() => idx > 0 && setPersist(FONT_SIZES[idx - 1])} disabled={idx <= 0} title="Smaller text" aria-label="Decrease text size">A−</button>
                <span className="blog-size-val" aria-live="polite" title="Current text size">{size}</span>
                <button className="blog-size-btn" onClick={() => idx < FONT_SIZES.length - 1 && setPersist(FONT_SIZES[idx + 1])} disabled={idx >= FONT_SIZES.length - 1} title="Larger text" aria-label="Increase text size">A+</button>
              </div>
            </div>
          </div>
          {/* ── title block ── */}
          <h1>{post.title}</h1>
          <p className="blog-article-desc">{post.description}</p>
          {/* ── byline: terminal status strip ── */}
          <div className="blog-article-byline">
            <img
              src={`https://github.com/${author}.png?size=32`}
              alt={author}
              className="blog-article-avatar"
              width={22} height={22}
            />
            <a href={profileUrl(author)} target="_blank" rel="noopener noreferrer" className="blog-article-author">@{author}</a>
            <span className="blog-article-byline-sep" aria-hidden="true" />
            <span className="blog-article-meta-item blog-article-date">{fmtDate(post.date)}</span>
            {readingTime && <><span className="blog-article-byline-sep" aria-hidden="true" /><span className="blog-article-meta-item blog-article-readtime">{readingTime} min read</span></>}
            <span className="blog-article-byline-sep" aria-hidden="true" />
            <span className="blog-article-meta-item blog-article-views">{views[`post:${post.slug}`] || 0} views</span>
          </div>
          {unlockOpen && !mgr && (
            <div className="blog-unlock blog-unlock--article">
              <p className="blog-unlock-hint">Only the site owner can manage posts. Paste a GitHub PAT with repo contents access — it is verified against @{OWNER_LOGIN}.</p>
              <div className="blog-unlock-row">
                <input type="password" value={pat} placeholder="GitHub PAT" onChange={(e) => setPat(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") unlock(pat); }} style={{ ...FIELD, flex: 1 }} />
                <button onClick={() => unlock(pat)} disabled={authBusy} className="blog-manage-btn blog-manage-btn--add">{authBusy ? "CHECKING…" : "UNLOCK"}</button>
                <button onClick={() => setUnlockOpen(false)} className="blog-manage-btn">CANCEL</button>
              </div>
              {authErr && <p className="blog-mgr-err">✗ {authErr}</p>}
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
          <div className="blog-prose" style={{ fontSize: size, ["--prose-scale" as string]: (size / 17).toFixed(3) }}>
            <Component />
          </div>
          <Comments slug={post.slug} />
        </article>
        <AdUnit slot="0123456789" />
      </div>
    </section>
  );
}
