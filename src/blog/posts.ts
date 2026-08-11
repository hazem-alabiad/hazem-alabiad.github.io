// Blog content loader — Vite eagerly imports every MDX post at build time.
// Frontmatter is exposed via remark-mdx-frontmatter as a named export.
type Post = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  accent?: string;
  author?: string;
  Component: () => JSX.Element;
};

const modules = import.meta.glob<{ default: () => JSX.Element; frontmatter: Record<string, unknown> }>("./posts/*.mdx", { eager: true });

export const posts: Post[] = Object.entries(modules)
  .map(([file, mod]) => {
    const slug = file.replace("./posts/", "").replace(/\.mdx$/, "");
    const fm = (mod.frontmatter || {}) as Record<string, any>;
    return {
      slug,
      title: String(fm.title ?? slug),
      date: String(fm.date ?? ""),
      description: String(fm.description ?? ""),
      tags: Array.isArray(fm.tags) ? (fm.tags as string[]).map((t) => String(t)) : [],
      accent: typeof fm.accent === "string" ? fm.accent : undefined,
      author: typeof fm.author === "string" ? fm.author : undefined,
      Component: mod.default,
    };
  })
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export type { Post };