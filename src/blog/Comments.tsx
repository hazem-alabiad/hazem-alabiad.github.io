import { useEffect, useState } from "react";
import Giscus from "@giscus/react";

// ─── Giscus config ───────────────────────────────────────────────────────────
// Repo:      hazem-alabiad/hazem-alabiad.github.io
// App:       https://github.com/apps/giscus  (must be installed on the repo)
// Discussions must be enabled on the repo.
//
// To get repo-id and category-id, run:
//   gh api graphql -f query='{ repository(owner:"hazem-alabiad", name:"hazem-alabiad.github.io") { id, discussionCategories(first:10){nodes{id,name}} } }'
// Then paste the values below.
const REPO       = "hazem-alabiad/hazem-alabiad.github.io" as const;
const REPO_ID    = "R_kgDONKmddA";          // ← replace if wrong
const CATEGORY   = "General";               // ← your Discussions category name
const CATEGORY_ID = "DIC_kwDONKmddA4Clysi"; // ← replace with real value

export function Comments({ slug }: { slug: string }) {
  // Mirror the site's data-theme attribute so Giscus stays in sync
  const [theme, setTheme] = useState<"dark_dimmed" | "light">(() =>
    document.documentElement.getAttribute("data-theme") === "light"
      ? "light"
      : "dark_dimmed"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute("data-theme");
      setTheme(t === "light" ? "light" : "dark_dimmed");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="blog-comments-giscus">
      <Giscus
        key={slug}                    // remount when post changes
        repo={REPO}
        repoId={REPO_ID}
        category={CATEGORY}
        categoryId={CATEGORY_ID}
        mapping="specific"
        term={slug}                   // each post gets its own discussion by slug
        strict="1"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={theme}
        lang="en"
        loading="lazy"
      />
    </div>
  );
}
