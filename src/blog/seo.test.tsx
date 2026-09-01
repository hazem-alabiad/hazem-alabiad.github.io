import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSEO } from "./seo";
import { posts } from "./posts";

function SEOProbe({ view, slug }: { view: "home" | "blog" | "post" | "admin"; slug?: string }) {
  const post = slug ? posts.find((p) => p.slug === slug) : undefined;
  useSEO(view, post);
  return <div data-testid="probe">{view}</div>;
}

beforeEach(() => {
  document.head.querySelectorAll("meta, link[rel=canonical], script#seo-jsonld").forEach((el) => el.remove());
});

function meta(name: string) {
  return document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content ?? "";
}
function prop(key: string) {
  return document.head.querySelector<HTMLMetaElement>(`meta[property="${key}"]`)?.content ?? "";
}

describe("useSEO", () => {
  it("sets home title, description and canonical", () => {
    render(<SEOProbe view="home" />);
    expect(document.title).toContain("Hazem Alabiad — Computational Linguist");
    expect(meta("description")).toContain("Full-Stack Engineer & NLP/LLM Researcher");
    expect(prop("og:type")).toBe("website");
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://hazem-alabiad.github.io/");
    expect(document.getElementById("seo-jsonld")).toBeNull();
  });

  it("sets the blog index meta and its JSON-LD listing", () => {
    render(<SEOProbe view="blog" />);
    expect(document.title).toBe("Notes & Ideas — Hazem Alabiad");
    expect(prop("og:type")).toBe("website");
    const jsonld = JSON.parse(document.getElementById("seo-jsonld")?.textContent || "{}");
    expect(jsonld["@type"]).toBe("Blog");
    expect(jsonld.blogPost.length).toBe(posts.length);
    expect(jsonld.blogPost[0].url).toContain(`#/blog/${posts[0].slug}`);
  });

  it("sets a BlogPosting JSON-LD for a specific post", () => {
    render(<SEOProbe view="post" slug="arabic-vmwe-llms" />);
    const post = posts.find((p) => p.slug === "arabic-vmwe-llms")!;
    expect(document.title).toBe(`${post.title} — Hazem Alabiad`);
    expect(prop("og:type")).toBe("article");
    const jsonld = JSON.parse(document.getElementById("seo-jsonld")?.textContent || "{}");
    expect(jsonld["@type"]).toBe("BlogPosting");
    expect(jsonld.headline).toBe(post.title);
    expect(jsonld.datePublished).toBe(post.date);
    expect(jsonld.keywords).toBe(post.tags.join(", "));
  });

  it("post with unknown slug falls back to generic blog title and no JSON-LD", () => {
    render(<SEOProbe view="post" slug="nope" />);
    expect(document.title).toBe("Blog — Hazem Alabiad");
    expect(document.getElementById("seo-jsonld")).toBeNull();
  });

  it("sets the admin view meta", () => {
    render(<SEOProbe view="admin" />);
    expect(document.title).toBe("Blog Admin — Hazem Alabiad");
    expect(meta("description")).toContain("Publishing dashboard");
  });

  it("updates when the view changes and removes JSON-LD for home", () => {
    const { rerender } = render(<SEOProbe view="post" slug="arabic-vmwe-llms" />);
    expect(document.getElementById("seo-jsonld")).not.toBeNull();
    rerender(<SEOProbe view="home" />);
    expect(screen.getByTestId("probe").textContent).toBe("home");
    expect(document.getElementById("seo-jsonld")).toBeNull();
  });
});