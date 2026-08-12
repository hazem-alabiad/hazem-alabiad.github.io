import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { posts, type Post } from "./posts";
import { readViews, trackView, type ViewsMap } from "./analytics";
import { AdUnit } from "../Adsense";

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
        <AdUnit slot="0123456789" className="ad-slot--top" />
        <div className="blog-list">
          {posts.map((p: Post) => (
            <article className={`blog-card blog-card--${p.accent || "amber"}`} key={p.slug} onClick={() => onOpen(p.slug)}>
              <div className="blog-card-top">
                <span className="blog-card-date">{fmtDate(p.date)} <span className="blog-card-rel">· {relDate(p.date)}</span></span>
                <span className="blog-card-views">{views[p.slug] || 0} views</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className="blog-card-tags">{p.tags.map((t) => <span key={t}>#{t}</span>)}</div>
              <div className="blog-card-foot">
                <a className="blog-card-author" href={profileUrl(authorOf(p))} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>✍ @{authorOf(p)}</a>
                <span className="blog-card-more">read →</span>
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
