import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { Comments } from "./Comments";
import { posts, type Post } from "./posts";
import { readViews, trackView, type ViewsMap } from "./analytics";
import { AdUnit } from "../Adsense";
import { useBlogManager } from "./manager";

const FONT_SCALE_KEY = "hazem_font_scale";
// 16–20 only: 22 is too large for comfortable reading and the A−/A+ reach is enough
const FONT_SIZES = [16, 18, 20];

const profileUrl = (username: string) => `https://linkedin.com/in/${username}`;
const shareUrl = (slug: string) => `${location.origin}${location.pathname}#/blog/${slug}`;
const authorOf = (p: Post) => (p.author && p.author.trim()) || "hazem-alabiad";

// the boot screen (full-viewport fixed overlay, dismissed on Enter/Space/click)
// clamps scroll while it is mounted — deep-link restore must wait for it to be gone
function bootOverlayPresent(): boolean {
  try {
    const overlay = document.querySelector("[data-boot-screen]");
    if (!overlay) return false;
    const cs = getComputedStyle(overlay);
    return cs.position === "fixed" && Number(cs.zIndex) >= 99999;
  } catch {
    return false;
  }
}
/** Scroll a section into view, waiting until the boot overlay is out of the way. */
function scrollToSection(id: string, opts?: ScrollIntoViewOptions): void {
  const target = () => document.getElementById(id);
  const run = () => {
    const el = target();
    if (el) el.scrollIntoView({ block: "start", ...opts });
  };
  const tryWhenFree = (attempt: number) => {
    if (!bootOverlayPresent()) { run(); return; }
    if (attempt >= 30) return; // overlay never left (e.g. disabled boot) — leave scroll as-is
    window.setTimeout(() => tryWhenFree(attempt + 1), 150);
  };
  tryWhenFree(0);
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

interface TocItem { id: string; text: string; level: 2 | 3 }

function TocNav({ items, activeId, onGo }: { items: TocItem[]; activeId: string | null; onGo: (id: string) => void }) {
  // scholarly numbering: h2 sections get 1, 2, 3… and h3 sub-sections 1.1, 1.2…
  // — mirrors exactly the margin numbers stamped next to the prose headings
  let main = 0;
  let sub = 0;
  const numbers: Record<string, string> = {};
  for (const it of items) {
    if (it.level === 3) { sub++; numbers[it.id] = `${main}.${sub}`; }
    else { main++; sub = 0; numbers[it.id] = String(main); }
  }
  return (
    <nav className="blog-toc-nav" aria-label="Sections">
      <ul>
        {items.map((it) => (
          <li key={it.id} className={it.level === 3 ? "blog-toc-li--sub" : ""}>
            <button
              type="button"
              className={`blog-toc-link${activeId === it.id ? " is-active" : ""}`}
              onClick={() => onGo(it.id)}
              aria-current={activeId === it.id ? "true" : undefined}
            >
              <span className="blog-toc-num" aria-hidden="true">{numbers[it.id]}</span>
              <span className="blog-toc-text">{it.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function slugId(text: string, used: Set<string>): string {
  const base = text.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/^-+|-+$/g, "") || "section";
  let id = base;
  let n = 2;
  while (used.has(id)) { id = `${base}-${n}`; n++; }
  used.add(id);
  return id;
}

export function BlogIndex({ onOpen }: { onOpen: (slug: string) => void }) {
  const navigate = useNavigate();
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

  const { mgr, mgrErr, mgrOk, visiblePosts, removePost } = useBlogManager();

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
            {mgr && (
              <div className="blog-owner-corner" aria-label="Blog owner controls">
                <button className="blog-owner-corner-btn blog-owner-corner-btn--add" onClick={() => navigate("/blog/admin/new")} title="Create a new blog post"><Plus size={13} /><span>NEW POST</span></button>
              </div>
            )}
          </div>
          <p className="blog-lede">Writing on NLP research, language engineering, and the craft of shipping software. {visiblePosts.length} post{visiblePosts.length === 1 ? "" : "s"}.</p>
        </div>
        <div className="blog-toolbar">
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
        </div>
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
                      <button className="blog-card-manage blog-card-manage--ionly" title="Edit post" aria-label={`Edit ${p.slug}`} onClick={(e) => { e.stopPropagation(); navigate(`/blog/admin/edit/${p.slug}`); }}><Pencil size={12} /></button>
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
  const navigate = useNavigate();
  const { mgr, publishing, removePost, mgrErr, mgrOk } = useBlogManager();
  const [readingTime, setReadingTime] = useState<number | null>(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

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
      // copy button
      if (!pre.querySelector(".blog-copy")) {
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
      }
      // language chip
      if (!pre.querySelector(".blog-code-lang")) {
        const lang = Array.from(pre.querySelectorAll("code")).map((c) => (c.className || "").match(/language-(\w+)/)?.[1]).find(Boolean);
        if (lang) {
          const chip = document.createElement("span");
          chip.className = "blog-code-lang";
          chip.textContent = lang;
          pre.appendChild(chip);
        }
      }
    });
  }, [slug, size]);

  // build the on-this-page index from rendered headings + add hover anchors
  useEffect(() => {
    const prose = document.querySelector(".blog-prose");
    setToc([]); setActiveId(null);
    if (!prose) return;
    const used = new Set<string>();
    const headings = Array.from(prose.querySelectorAll<HTMLHeadingElement>("h2, h3"));
    const items: TocItem[] = headings.map((h) => {
      if (!h.id) h.id = slugId(h.textContent || "", used);
      else used.add(h.id);
      // heading text without the injected anchor button
      const headingText = Array.from(h.childNodes)
        .filter((n) => !(n instanceof HTMLElement) || !n.classList.contains("blog-heading-anchor"))
        .map((n) => n.textContent || "")
        .join("")
        .trim();
      if (!h.querySelector(".blog-heading-anchor")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "blog-heading-anchor";
        btn.textContent = "#";
        btn.title = `Link to ${headingText}`;
        btn.setAttribute("aria-label", `Link to ${headingText}`);
        btn.addEventListener("click", () => goSection(h.id));
        h.appendChild(btn);
      }
      // clicking the headline itself also pins its anchor to the URI
      h.classList.add("blog-heading-link");
      h.setAttribute("role", "link");
      h.setAttribute("tabindex", "0");
      const onGo = () => goSection(h.id);
      h.addEventListener("click", onGo);
      h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onGo(); } });
      h.addEventListener("focus", () => setActiveId(h.id));
      return { id: h.id, text: headingText, level: h.tagName === "H2" ? 2 : 3 };
    });
    setToc(items);
    // deep link: #/blog/<slug>#<section-id> — restore scroll, but only once
    // the boot screen overlay is out of the way (otherwise its fixed viewport
    // clamps the scroll and unmounting shifts the position out of view)
    const anchorId = location.hash.split("#").pop();
    if (anchorId && items.some((i) => i.id === anchorId)) {
      setActiveId(anchorId);
      scrollToSection(anchorId);
    }
    if (items.length < 2) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const shown = entries.filter((e) => e.isIntersecting);
        if (shown.length) setActiveId(shown[shown.length - 1].target.id);
      },
      { rootMargin: "-90px 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // scroll to a section and record its anchor in the URI (replaceState so
  // rapid clicks don't flood history; the hash router ignores the #section tail)
  const sectionHash = `#/blog/${slug}`;
  const goSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
    try {
      const target = `${sectionHash}#${id}`;
      const current = location.hash.replace(/^#/, "");
      if (!current.startsWith(`/blog/${slug}#`) || current !== `${sectionHash.replace(/^#/, "")}#${id}`) {
        history.replaceState(null, "", `${location.pathname}${location.search}#${target.replace(/^#/, "")}`);
      }
    } catch { /* ignore */ }
  };
  const ordered = posts.filter((p) => !hiddenSlugs.has(p.slug));
  const pos = ordered.findIndex((p) => p.slug === slug);
  const newer = pos > 0 ? ordered[pos - 1] : null;
  const older = pos >= 0 && pos < ordered.length - 1 ? ordered[pos + 1] : null;
  const tocNav = <TocNav items={toc} activeId={activeId} onGo={goSection} />;
  const showAside = toc.length >= 2;
  return (
    <section className={`blog blog-post blog-post--${accent || "amber"}`} id="blog">
      <div className="blog-post-layout">
        <button className="btn blog-back" onClick={onBack}>← all notes</button>
        <article className="blog-article">
          {/* ── masthead: tag kicker + quiet reading tools ── */}
          <div className="blog-article-masthead">
            <div className="blog-article-kicker" aria-label="Tags">
              {post.tags.map((t) => <span key={t} className={`blog-article-kicker-tag blog-article-kicker-tag--${accent || "amber"}`}>#{t}</span>)}
            </div>
          <div className="blog-article-utils" role="toolbar" aria-label="Reading tools">
            {mgr && (
              <>
                <button className="blog-util" title="Edit this post" aria-label="Edit post" onClick={() => navigate(`/blog/admin/edit/${post.slug}`)} disabled={publishing}><Pencil size={14} /></button>
                <button className="blog-util blog-util--danger" title="Delete this post" aria-label="Delete post" onClick={() => { if (removePost) removePost(post); }} disabled={publishing}><Trash2 size={14} /></button>
                <span className="blog-util-sep" aria-hidden="true" />
              </>
            )}
            <button className="blog-util" onClick={copyLink} title={copied ? "Link copied" : "Copy link"} aria-label={copied ? "Link copied" : "Copy link"}>
              {copied ? <Check size={14} /> : <Share2 size={14} />}
            </button>
            <div className="blog-size-group" role="group" aria-label="Text size">
                <button className="blog-size-btn" onClick={() => idx > 0 && setPersist(FONT_SIZES[idx - 1])} disabled={idx <= 0} title="Smaller text" aria-label="Decrease text size">A−</button>
                <button className="blog-size-btn" onClick={() => idx < FONT_SIZES.length - 1 && setPersist(FONT_SIZES[idx + 1])} disabled={idx >= FONT_SIZES.length - 1} title="Larger text" aria-label="Increase text size">A+</button>
              </div>
            </div>
          </div>
          {/* ── title block ── */}
          <h1>{post.title}</h1>
          <p className="blog-article-desc">{post.description}</p>
          {/* ── byline: one clean line, no avatar — the note speaks for itself ── */}
          <div className="blog-article-byline">
            <a href={profileUrl(author)} target="_blank" rel="noopener noreferrer" className="blog-article-author">@{author}</a>
            <span className="blog-article-byline-sep" aria-hidden="true">·</span>
            <span className="blog-article-date">{fmtDate(post.date)}</span>
            {readingTime && <><span className="blog-article-byline-sep" aria-hidden="true">·</span><span className="blog-article-readtime">{readingTime} min read</span></>}
            <span className="blog-article-byline-sep" aria-hidden="true">·</span>
            <span className="blog-article-views">{views[`post:${post.slug}`] || 0} views</span>
          </div>
          {mgrErr && <p className="blog-mgr-err">✗ {mgrErr}</p>}
          {mgrOk && <p className="blog-mgr-ok">✓ {mgrOk}</p>}
          {showAside && (
            <details className="blog-toc-mobile">
              <summary className="blog-toc-summary">ON THIS PAGE <span className="blog-toc-count">{toc.length}</span></summary>
              {tocNav}
            </details>
          )}
          <div className="blog-prose" style={{ fontSize: size, ["--prose-scale" as string]: (size / 17).toFixed(3) }}>
            <Component />
          </div>

          <div className="blog-article-end" aria-hidden="true">
            <span className="blog-article-end-prompt">$</span>
            <span className="blog-article-end-text">end of note</span>
            <span className="blog-article-end-cursor" />
          </div>

          <div className="blog-article-authorcard">
            <img
              src={`https://github.com/${author}.png?size=96`}
              alt={author}
              className="blog-article-authorcard-avatar"
              width={48} height={48}
            />
            <div className="blog-article-authorcard-body">
              <div className="blog-article-authorcard-name">
                <a href={`https://github.com/${author}`} target="_blank" rel="noopener noreferrer" className="blog-article-authorcard-handle">@{author}</a>
                <span className="blog-article-authorcard-role">field notes — NLP &amp; language engineering</span>
              </div>
              <p className="blog-article-authorcard-bio">Writing on NLP research, language engineering, and the craft of shipping software.</p>
              <div className="blog-article-authorcard-links">
                <a href={`https://github.com/${author}`} target="_blank" rel="noopener noreferrer">GitHub</a>
                <a href={profileUrl(author)} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </div>
          </div>

          {(newer || older) && (
            <nav className="blog-article-prevnext" aria-label="More notes">
              {newer ? (
                <button type="button" className="blog-article-nav" onClick={() => navigate(`/blog/${newer.slug}`)}>
                  <span className="blog-article-nav-dir">← NEWER</span>
                  <span className="blog-article-nav-title">{newer.title}</span>
                </button>
              ) : <span className="blog-article-nav blog-article-nav--empty" aria-hidden="true" />}
              {older ? (
                <button type="button" className="blog-article-nav blog-article-nav--next" onClick={() => navigate(`/blog/${older.slug}`)}>
                  <span className="blog-article-nav-dir">OLDER →</span>
                  <span className="blog-article-nav-title">{older.title}</span>
                </button>
              ) : <span className="blog-article-nav blog-article-nav--empty" aria-hidden="true" />}
            </nav>
          )}

          <div className="blog-article-comments">
            <div className="blog-article-comments-label">COMMENTS</div>
            <Comments slug={post.slug} />
          </div>
        </article>
        {showAside && (
          <aside className="blog-toc" aria-label="On this page">
            <div className="blog-toc-label">ON THIS PAGE</div>
            {tocNav}
          </aside>
        )}
        <AdUnit slot="0123456789" />
      </div>
    </section>
  );
}
