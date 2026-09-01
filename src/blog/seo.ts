import { useEffect } from "react";
import { posts, type Post } from "./posts";

const SITE_URL = "https://hazem-alabiad.github.io";
const SITE_IMAGE = `${SITE_URL}/og-image.jpg`;
const HOME_TITLE = "Hazem Alabiad — Computational Linguist & Full-Stack Engineer";
const HOME_DESC =
  "Full-Stack Engineer & NLP/LLM Researcher in Tübingen, Germany. 6+ years shipping production software (Getir, IBM), currently building LLM systems. Open to NLP/AI/full-stack roles.";

type SEOView = "home" | "blog" | "post" | "admin";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let m = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!m) {
    m = document.createElement("meta");
    m.setAttribute(attr, key);
    document.head.appendChild(m);
  }
  m.setAttribute("content", content);
}

function setCanonical(url: string) {
  let l = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!l) {
    l = document.createElement("link");
    l.rel = "canonical";
    document.head.appendChild(l);
  }
  l.href = url;
}

function setJsonLd(data: object | null) {
  const id = "seo-jsonld";
  let s = document.getElementById(id) as HTMLScriptElement | null;
  if (!data) {
    if (s) s.remove();
    return;
  }
  if (!s) {
    s = document.createElement("script");
    s.type = "application/ld+json";
    s.id = id;
    document.head.appendChild(s);
  }
  s.textContent = JSON.stringify(data);
}

export function useSEO(view: SEOView, post?: Post) {
  useEffect(() => {
    let title: string;
    let desc: string;
    let canonical: string;
    let jsonld: object | null = null;

    if (view === "post") {
      title = post ? `${post.title} — Hazem Alabiad` : "Blog — Hazem Alabiad";
      desc = post?.description || "A note on NLP, language engineering, and shipping software.";
      canonical = `${SITE_URL}/#/blog/${post?.slug || ""}`;
      if (post) {
        jsonld = {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          description: post.description,
          datePublished: post.date,
          author: {
            "@type": "Person",
            name: post.author || "Hazem Alabiad",
            url: `https://github.com/${post.author || "hazem-alabiad"}`,
          },
          image: SITE_IMAGE,
          url: canonical,
          keywords: post.tags.join(", "),
          mainEntityOfPage: canonical,
        };
      }
    } else if (view === "blog") {
      title = "Notes & Ideas — Hazem Alabiad";
      desc = "Long-form notes on NLP research, language engineering, and the craft of shipping software.";
      canonical = `${SITE_URL}/#/blog`;
      jsonld = {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Notes & Ideas — Hazem Alabiad",
        url: canonical,
        description: desc,
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: `${SITE_URL}/#/blog/${p.slug}`,
          datePublished: p.date,
          description: p.description,
        })),
      };
    } else if (view === "admin") {
      title = "Blog Admin — Hazem Alabiad";
      desc = "Publishing dashboard for the blog.";
      canonical = `${SITE_URL}/#/blog/admin`;
    } else {
      title = HOME_TITLE;
      desc = HOME_DESC;
      canonical = `${SITE_URL}/`;
      jsonld = null;
    }

    document.title = title;
    setMeta("name", "description", desc);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:type", view === "post" ? "article" : "website");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setCanonical(canonical);
    setJsonLd(jsonld);
  }, [view, post]);
}