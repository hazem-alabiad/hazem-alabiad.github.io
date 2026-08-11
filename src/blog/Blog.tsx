import { useEffect, useState } from "react";
import { posts, type Post } from "./posts";
import { readViews, trackView } from "./analytics";
import BlogAdmin from "./BlogAdmin";

function fmtDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export function BlogIndex({ onOpen }: { onOpen: (slug: string) => void }) {
  const [views] = useState(readViews);
  const [admin, setAdmin] = useState(false);
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
        <div className="blog-list">
          {posts.map((p: Post) => (
            <article className={`blog-card blog-card--${p.accent || "amber"}`} key={p.slug} onClick={() => onOpen(p.slug)}>
              <div className="blog-card-top">
                <span className="blog-card-date">{fmtDate(p.date)}</span>
                <span className="blog-card-views">{views[p.slug] || 0} views</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <div className="blog-card-tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
              <span className="blog-card-more">read →</span>
            </article>
          ))}
        </div>
        <div className="blog-base">
          <span>✎ written by hand · analytics via local view counter · </span>
          <button
            className="blog-admin-toggle"
            onClick={() => setAdmin((a) => !a)}
            title={admin ? "Close post manager" : "Manage posts (authorized accounts only)"}
          >
            {admin ? "close admin ✕" : "manage posts"}
          </button>
        </div>
        {admin && <BlogAdmin />}
      </div>
    </section>
  );
}

export function BlogPost({ slug, onBack }: { slug: string; onBack: () => void }) {
  const post = posts.find((p) => p.slug === slug);
  useEffect(() => {
    if (post) trackView(`post:${post.slug}`);
  }, [slug]);
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
  return (
    <section className={`blog blog-post blog-post--${accent || "amber"}`} id="blog">
      <div className="wrap">
        <button className="btn blog-back" onClick={onBack}>← all notes</button>
        <article className="blog-article">
          <div className="blog-article-meta">
            <span className="blog-article-date">{fmtDate(post.date)}</span>
            <span className="blog-article-dot">·</span>
            <span className="blog-article-tags">{post.tags.join(" · ")}</span>
          </div>
          <h1>{post.title}</h1>
          <p className="blog-article-desc">{post.description}</p>
          <div className="blog-prose">
            <Component />
          </div>
          <div className="blog-article-foot">
            <span>Thanks for reading — feedback welcome.</span>
          </div>
        </article>
      </div>
    </section>
  );
}