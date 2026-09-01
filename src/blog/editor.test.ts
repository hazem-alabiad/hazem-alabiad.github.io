import { describe, it, expect, vi, afterEach } from "vitest";
import {
  sanitizeToken, verifyToken, saveBlogSession, loadBlogSession, clearBlogSession,
  parseFrontmatter, parseTags, buildMdx, EMPTY_DRAFT, BLOG_TOKEN_KEY, BLOG_USER_KEY,
} from "./editor";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("sanitizeToken", () => {
  it("strips non-ASCII characters and trims", () => {
    expect(sanitizeToken("  ghp_abc  ")).toBe("ghp_abc");
    expect(sanitizeToken("ghp_abc\u00e9\u0007")).toBe("ghp_abc");
  });
});

describe("verifyToken", () => {
  function jsonOk(data: unknown) {
    return { ok: true, status: 200, json: async () => data } as Response;
  }

  it("resolves the owner user for a valid token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonOk({ login: "hazem-alabiad", email: "h@h.io" })));
    await expect(verifyToken("ghp_valid")).resolves.toEqual({ login: "hazem-alabiad", email: "h@h.io" });
  });

  it("rejects empty or non-ASCII-only tokens before fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(verifyToken("   ")).rejects.toThrow("Token is empty");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-owner logins", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonOk({ login: "someone-else" })));
    await expect(verifyToken("ghp_x")).rejects.toThrow("Only the site owner (@hazem-alabiad)");
  });

  it("throws the API message on HTTP errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ message: "Bad credentials" }) })));
    await expect(verifyToken("ghp_bad")).rejects.toThrow("Bad credentials");
  });
});

describe("blog session storage", () => {
  it("saves, loads and clears the session in localStorage", () => {
    expect(loadBlogSession()).toBeNull();
    saveBlogSession("ghp_token", "hazem-alabiad");
    expect(loadBlogSession()).toEqual({ token: "ghp_token", login: "hazem-alabiad" });
    expect(localStorage.getItem(BLOG_USER_KEY)).toBe("hazem-alabiad");
    clearBlogSession();
    expect(loadBlogSession()).toBeNull();
  });

  it("saveBlogSession sanitizes the stored token", () => {
    saveBlogSession(" ghp_caf\u00e9 ", "x");
    expect(localStorage.getItem(BLOG_TOKEN_KEY)).toBe("ghp_caf");
  });
});

describe("parseFrontmatter", () => {
  it("extracts frontmatter keys and body", () => {
    const { fm, body } = parseFrontmatter('---\ntitle: "Hello"\ndate: "2026-08-01"\ntags: ["a", "b"]\n---\n\nBody text here.');
    expect(fm).toMatchObject({ title: "Hello", date: "2026-08-01", tags: "a,b" });
    expect(body).toBe("Body text here.");
  });

  it("returns the raw string when there is no frontmatter block", () => {
    const { fm, body } = parseFrontmatter("# Just a body");
    expect(fm).toEqual({});
    expect(body).toBe("# Just a body");
  });

  it("guards against colons inside values", () => {
    const { fm } = parseFrontmatter('---\ndescription: "a: b: c"\n---\n\nx');
    expect(fm.description).toBe("a: b: c");
  });
});

describe("parseTags", () => {
  it("splits, trims and strips braces/quotes", () => {
    expect(parseTags('  NLP , "Arabic",  [LLMs] ,')).toEqual(["NLP", "Arabic", "LLMs"]);
  });
  it("returns [] for empty input", () => {
    expect(parseTags(undefined)).toEqual([]);
    expect(parseTags("   ")).toEqual([]);
  });
});

describe("buildMdx", () => {
  it("emits frontmatter and body, escaping quotes and backslashes", () => {
    const mdx = buildMdx({
      isNew: true, slug: "", path: "", title: 'Say "Hi" \\ there', date: "2026-08-02",
      description: "d", tags: ["NLP", "Arabic"], accent: "violet", author: "hazem-alabiad", body: "# Body\n\nline",
    });
    expect(mdx).toContain('title: "Say \\"Hi\\" \\\\ there"');
    expect(mdx).toContain('date: "2026-08-02"');
    expect(mdx).toContain('tags: ["NLP", "Arabic"]');
    expect(mdx).toContain('accent: "violet"');
    expect(mdx).toContain('author: "hazem-alabiad"');
    expect(mdx).toContain("# Body\n\nline\n");
  });

  it("omits empty author/tags/accent keys", () => {
    const mdx = buildMdx({ isNew: true, slug: "s", path: "p", title: "t", date: "2026-01-01", description: "", tags: [], accent: "", author: "  ", body: "b" });
    expect(mdx).not.toContain("author:");
    expect(mdx).not.toContain("tags:");
    expect(mdx).not.toContain("accent:");
  });

  it("round-trips through parseFrontmatter", () => {
    const draft = { isNew: true, slug: "s", path: "p", title: "Title", date: "2026-03-03", description: "desc", tags: ["one", "two"], accent: "amber", author: "hazem-alabiad", body: "# h1" };
    const { fm, body } = parseFrontmatter(buildMdx(draft));
    expect(fm.title).toBe("Title");
    expect(fm.date).toBe("2026-03-03");
    expect(fm.accent).toBe("amber");
    expect(parseTags(fm.tags)).toEqual(["one", "two"]);
    expect(body).toBe("# h1");
  });

  it("EMPTY_DRAFT is a new, empty draft with today's date", () => {
    expect(EMPTY_DRAFT.isNew).toBe(true);
    expect(EMPTY_DRAFT.title).toBe("");
    expect(EMPTY_DRAFT.tags).toEqual([]);
    expect(EMPTY_DRAFT.accent).toBe("amber");
    expect(EMPTY_DRAFT.author).toBe("hazem-alabiad");
    expect(EMPTY_DRAFT.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});