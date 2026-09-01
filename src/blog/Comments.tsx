import { useEffect, useState } from "react";
import Giscus from "@giscus/react";

export const GISCUS_CONFIG = {
  repo: "hazem-alabiad/hazem-alabiad.github.io" as const,
  repoId: "R_kgDOTVSCwQ",
  category: "General" as const,
  categoryId: "DIC_kwDOTVSCwc4DEpR2",
};

const DISCUSSION_URL = "https://github.com/hazem-alabiad/hazem-alabiad.github.io/discussions";

export function Comments({ slug }: { slug: string }) {
  const [theme, setTheme] = useState<"dark_dimmed" | "light">(() => document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark_dimmed");

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark_dimmed"));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return <section className="blog-comments-giscus" aria-label="Comments">
    <Giscus
      {...GISCUS_CONFIG}
      mapping="specific"
      term={slug}
      strict="1"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme={theme}
      lang="en"
      loading="lazy"
    />
    <p className="blog-comments-fallback-note">
      <a href={`${DISCUSSION_URL}?discussions_q=${encodeURIComponent(slug)}`} target="_blank" rel="noopener noreferrer">
        Manage comments on GitHub ↗
      </a>
    </p>
  </section>;
}
