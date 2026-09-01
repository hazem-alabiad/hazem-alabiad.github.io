import { describe, it, expect, vi, afterEach } from "vitest";
import {
  GH_OWNER, GH_REPO, GH_BRANCH, POSTS_DIR,
  listPosts, getFileSha, readPost, writePost, deletePost,
  findOrCreateIssue, listComments, postComment, verifyGhUser, slugify, todayISO,
} from "./github";

const API = "https://api.github.com";

function jsonResponse(data: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => data } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("github contents API", () => {
  it("listPosts returns [] on 404 (no posts dir yet)", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ message: "Not Found" }, 404));
    vi.stubGlobal("fetch", fetchMock);
    await expect(listPosts("tok")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API}/repos/${GH_OWNER}/${GH_REPO}/contents/${POSTS_DIR}?ref=${GH_BRANCH}`,
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "token tok" }) })
    );
  });

  it("listPosts maps mdx files, skipping directories and non-mdx files", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse([
      { type: "file", name: "a.mdx", path: `${POSTS_DIR}/a.mdx`, sha: "s1" },
      { type: "file", name: "readme.md", path: `${POSTS_DIR}/readme.md`, sha: "s2" },
      { type: "dir", name: "drafts", path: `${POSTS_DIR}/drafts`, sha: "s3" },
    ])));
    await expect(listPosts("tok")).resolves.toEqual([
      { path: `${POSTS_DIR}/a.mdx`, sha: "s1", name: "a.mdx" },
    ]);
  });

  it("listPosts returns [] when the response is not an array", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ sha: "x" })));
    await expect(listPosts("tok")).resolves.toEqual([]);
  });

  it("throws a GhError on non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "Bad credentials" }, 401)));
    await expect(listPosts("tok")).rejects.toMatchObject({ status: 401, message: "Bad credentials" });
  });

  it("getFileSha returns null on 404 and the sha otherwise", async () => {
    const f404 = vi.fn(async () => jsonResponse({}, 404));
    vi.stubGlobal("fetch", f404);
    await expect(getFileSha("tok", "a.mdx")).resolves.toBeNull();
    const fOk = vi.fn(async () => jsonResponse({ sha: "abc123" }));
    vi.stubGlobal("fetch", fOk);
    await expect(getFileSha("tok", "a.mdx")).resolves.toBe("abc123");
  });

  it("readPost base64-decodes content and trims trailing newline", async () => {
    const b64 = btoa(unescape(encodeURIComponent("# Hello\nworld\n")));
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ content: b64 })));
    await expect(readPost("tok", "a.mdx")).resolves.toBe("# Hello\nworld");
  });

  it("writePost PUTs base64 content and includes sha for updates", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    await writePost("tok", "a.mdx", "# hi", "sha1");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API}/repos/${GH_OWNER}/${GH_REPO}/contents/a.mdx`);
    expect(init.method).toBe("PUT");
    const body = JSON.parse(init.body as string);
    expect(body.message).toContain("blog: update a.mdx");
    expect(body.branch).toBe(GH_BRANCH);
    expect(body.sha).toBe("sha1");
    expect(Buffer.from(body.content, "base64").toString()).toBe("# hi");
  });

  it("writePost for a new file omits sha and uses publish message", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    await writePost("tok", "b.mdx", "body");
    const body = JSON.parse(((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]).body as string);
    expect(body.message).toBe("blog: publish b.mdx");
    expect(body.sha).toBeUndefined();
  });

  it("deletePost sends a DELETE with message, branch and sha", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    await deletePost("tok", "a.mdx", "sha9");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API}/repos/${GH_OWNER}/${GH_REPO}/contents/a.mdx`);
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(init.body as string)).toMatchObject({ message: "blog: delete a.mdx", branch: GH_BRANCH, sha: "sha9" });
  });
});

describe("github issues API for comments", () => {
  it("findOrCreateIssue returns the first search hit", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ items: [{ number: 7, html_url: "https://github.com/issue/7" }] }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(findOrCreateIssue("tok", "my-slug", "My Post")).resolves.toEqual({ number: 7, html_url: "https://github.com/issue/7" });
    expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toContain("/search/issues?q=");
  });

  it("findOrCreateIssue creates an issue when the search is empty", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("/search/issues")
        ? jsonResponse({ items: [] })
        : jsonResponse({ number: 12, html_url: "https://github.com/issue/12" })
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(findOrCreateIssue("tok", "my-slug", "My Post")).resolves.toMatchObject({ number: 12 });
    const createCall = fetchMock.mock.calls[1] as unknown as [string, RequestInit];
    expect(createCall[0]).toBe(`${API}/repos/${GH_OWNER}/${GH_REPO}/issues`);
    expect(createCall[1].method).toBe("POST");
    const body = JSON.parse(createCall[1].body as string);
    expect(body.title).toBe("[blog-comment] my-slug: My Post");
    expect(body.labels).toEqual(["blog-comment"]);
  });

  it("listComments returns [] on non-ok and the list on ok", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({}, 500)));
    await expect(listComments(1)).resolves.toEqual([]);
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse([{ id: 1, body: "hi" }])));
    await expect(listComments(1)).resolves.toEqual([{ id: 1, body: "hi" }]);
  });

  it("postComment prefixes the name and POSTs the body", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: 3, body: "x" }));
    vi.stubGlobal("fetch", fetchMock);
    await postComment("tok", 5, "Ada", "great post");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${API}/repos/${GH_OWNER}/${GH_REPO}/issues/5/comments`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string).body).toBe("**Ada** left a comment:\n\ngreat post");
  });

  it("verifyGhUser returns login/name/avatar_url", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ login: "ada", name: "Ada", avatar_url: "http://a" })));
    await expect(verifyGhUser("tok")).resolves.toEqual({ login: "ada", name: "Ada", avatar_url: "http://a" });
  });
});

describe("slugify + todayISO", () => {
  it("slugifies titles: lowercases, strips punctuation, dashes spaces, trims to 64", () => {
    expect(slugify("My Awesome Post!")).toBe("my-awesome-post");
    expect(slugify("  Hello   World  ")).toBe("hello-world");
    // NFKD normalization strips accents before the \w filter
    expect(slugify("café naïve")).toBe("cafe-naive");
    expect(slugify("é".repeat(100))).toBe("e".repeat(64));
    expect(slugify("!!!")).toBe("untitled");
  });

  it("todayISO returns today's date in YYYY-MM-DD", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(todayISO()).toBe(new Date().toISOString().slice(0, 10));
  });
});