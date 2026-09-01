import { render, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BlogManagerProvider, useBlogManager } from "./manager";
import type { BlogManagerValue } from "./manager";
import { POSTS_DIR } from "../github";
import { BLOG_TOKEN_KEY, BLOG_USER_KEY } from "./editor";
import { posts } from "./posts";

const listPosts = vi.hoisted(() => vi.fn());
const readPost = vi.hoisted(() => vi.fn());
const writePost = vi.hoisted(() => vi.fn());
const deletePost = vi.hoisted(() => vi.fn());

vi.mock("../github", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../github")>();
  return {
    ...actual,
    listPosts,
    readPost,
    writePost,
    deletePost,
  };
});

let api: BlogManagerValue | null = null;
function Probe() {
  api = useBlogManager();
  return null;
}

function renderProvider() {
  render(
    <BlogManagerProvider>
      <Probe />
    </BlogManagerProvider>
  );
}

const OWNER_USER = { login: "hazem-alabiad", email: null };

function fetchOk(data: unknown) {
  return { ok: true, status: 200, json: async () => data } as Response;
}
function fetchErr(status: number, message: string) {
  return { ok: false, status, json: async () => ({ message }) } as Response;
}

const draft = {
  isNew: true, slug: "", path: "", title: "My New Note",
  date: "2026-08-05", description: "A fresh note", tags: ["NLP"],
  accent: "amber", author: "hazem-alabiad", body: "# Hello",
};

const anyPost = posts[0];

beforeEach(() => {
  api = null;
  listPosts.mockReset();
  readPost.mockReset();
  writePost.mockReset();
  deletePost.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  // manager's mount effect re-verifies stored sessions; make sure nothing leaks
  vi.unstubAllGlobals();
});

describe("BlogManagerProvider", () => {
  it("starts locked with an empty token and all posts visible", () => {
    renderProvider();
    expect(api!.mgr).toBeNull();
    expect(api!.token).toBeNull();
    expect(api!.visiblePosts).toHaveLength(posts.length);
    expect(api!.unlockOpen).toBe(false);
  });

  it("unlock saves the session and marks the owner as manager", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    expect(api!.mgr).toEqual({ login: "hazem-alabiad" });
    expect(api!.token).toBe("ghp_tok");
    expect(api!.authErr).toBe("");
    expect(api!.unlockOpen).toBe(false);
    await waitFor(() => expect(localStorage.getItem(BLOG_TOKEN_KEY)).toBe("ghp_tok"));
    expect(localStorage.getItem(BLOG_USER_KEY)).toBe("hazem-alabiad");
  });

  it("unlock rejects a non-owner login with an auth error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk({ login: "attacker", email: null })));
    renderProvider();
    await act(async () => { await expect(api!.unlock("ghp_tok")).rejects.toThrow(/site owner/); });
    expect(api!.mgr).toBeNull();
    expect(api!.authErr).toContain("Only the site owner");
  });

  it("unlock surfaces the API error message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchErr(401, "Bad credentials")));
    renderProvider();
    await act(async () => { await expect(api!.unlock("ghp_bad")).rejects.toThrow("Bad credentials"); });
    expect(api!.authErr).toBe("Bad credentials");
  });

  it("unlock rejects empty tokens without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderProvider();
    await act(async () => { await expect(api!.unlock("   ")).rejects.toThrow("Token is empty"); });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("restores a manager from a saved session on mount", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    localStorage.setItem(BLOG_TOKEN_KEY, "ghp_saved");
    localStorage.setItem(BLOG_USER_KEY, "hazem-alabiad");
    renderProvider();
    await waitFor(() => expect(api!.mgr).toEqual({ login: "hazem-alabiad" }));
    expect(api!.token).toBe("ghp_saved");
  });

  it("migrates the legacy CMS token to the blog session", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    localStorage.setItem("hazem-cms-token", "ghp_legacy");
    renderProvider();
    await waitFor(() => expect(api!.mgr).toEqual({ login: "hazem-alabiad" }));
    expect(localStorage.getItem(BLOG_TOKEN_KEY)).toBe("ghp_legacy");
    expect(localStorage.getItem("hazem-cms-token")).toBeNull();
  });

  it("lock disables editing but keeps the stored token", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    act(() => api!.lock());
    expect(api!.mgr).toBeNull();
    expect(localStorage.getItem(BLOG_TOKEN_KEY)).toBe("ghp_tok");
  });

  it("restore() re-verifies the stored token after a lock", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    act(() => api!.lock());
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    await act(async () => { expect(await api!.restore()).toBe(true); });
    expect(api!.mgr).toEqual({ login: "hazem-alabiad" });
  });

  it("restore() returns false and clears the token when it was revoked", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchErr(401, "Bad credentials")));
    localStorage.setItem(BLOG_TOKEN_KEY, "ghp_dead");
    renderProvider();
    await act(async () => { expect(await api!.restore()).toBe(false); });
    expect(api!.mgr).toBeNull();
    expect(localStorage.getItem(BLOG_TOKEN_KEY)).toBeNull();
  });

  it("publishDraft writes the compiled mdx and reports success", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    writePost.mockResolvedValue(undefined);
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    await act(async () => { await api!.publishDraft(draft); });
    expect(writePost).toHaveBeenCalledTimes(1);
    const [token, path, content, sha] = writePost.mock.calls[0] as unknown as [string, string, string, string | undefined];
    expect(token).toBe("ghp_tok");
    expect(path).toBe(`${POSTS_DIR}/my-new-note.mdx`);
    expect(sha).toBeUndefined();
    expect(content).toContain('title: "My New Note"');
    expect(content).toContain('# Hello');
    expect(api!.mgrOk).toContain("Saved");
    expect(api!.mgrErr).toBe("");
  });

  it("publishDraft updates an existing post with its sha", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    writePost.mockResolvedValue(undefined);
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    const edit = { ...draft, isNew: false, slug: "arabic-vmwe-llms", path: `${POSTS_DIR}/arabic-vmwe-llms.mdx`, sha: "sha_old" };
    await act(async () => { await api!.publishDraft(edit); });
    const call = writePost.mock.calls[0] as unknown as [string, string, string, string | undefined];
    expect(call[1]).toBe(`${POSTS_DIR}/arabic-vmwe-llms.mdx`);
    expect(call[3]).toBe("sha_old");
  });

  it("publishDraft fails with an error message when unauthenticated", async () => {
    renderProvider();
    await act(async () => { await expect(api!.publishDraft(draft)).rejects.toThrow("Not authenticated"); });
    expect(api!.mgrErr).toContain("Not authenticated");
    expect(writePost).not.toHaveBeenCalled();
  });

  it("publishDraft rejects an empty title", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    await act(async () => { await expect(api!.publishDraft({ ...draft, title: "  " })).rejects.toThrow("Title is required"); });
    expect(api!.mgrErr).toContain("Title is required");
    expect(writePost).not.toHaveBeenCalled();
  });

  it("publishDraft surfaces write failures", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    writePost.mockRejectedValue(new Error("contents: write refused"));
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    await act(async () => { await expect(api!.publishDraft(draft)).rejects.toThrow("contents: write refused"); });
    expect(api!.mgrErr).toContain("contents: write refused");
  });

  it("loadPostDraft fetches and parses the mdx from the repo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    readPost.mockResolvedValue('---\ntitle: "Repo Title"\ndate: "2026-01-01"\ndescription: "repo desc"\ntags: ["ml", "evals"]\naccent: "violet"\n---\n\nRepo body');
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    const loaded = await act(async () => api!.loadPostDraft("arabic-vmwe-llms"));
    expect(readPost).toHaveBeenCalledWith("ghp_tok", `${POSTS_DIR}/arabic-vmwe-llms.mdx`);
    expect(loaded).toMatchObject({
      isNew: false, slug: "arabic-vmwe-llms", path: `${POSTS_DIR}/arabic-vmwe-llms.mdx`,
      title: "Repo Title", date: "2026-01-01", description: "repo desc",
      tags: ["ml", "evals"], body: "Repo body",
    });
    // the bundled post accent wins over repo frontmatter
    expect(loaded.accent).toBe(posts[0].accent || "amber");
  });

  it("loadPostDraft falls back to the bundled post metadata", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    readPost.mockResolvedValue("# bare body");
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    const loaded = await act(async () => api!.loadPostDraft("arabic-vmwe-llms"));
    expect(loaded.title).toBe(posts[0].title);
    expect(loaded.tags).toEqual(posts[0].tags);
    expect(loaded.accent).toBe("amber");
  });

  it("loadPostDraft throws when unauthenticated", async () => {
    renderProvider();
    await expect(act(async () => api!.loadPostDraft("x"))).rejects.toThrow("Not authenticated");
    expect(readPost).not.toHaveBeenCalled();
  });

  it("removePost deletes the file and hides the post locally", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    const path = `${POSTS_DIR}/${anyPost.slug}.mdx`;
    listPosts.mockResolvedValue([{ path, sha: "sha_f", name: `${anyPost.slug}.mdx` }]);
    deletePost.mockResolvedValue(undefined);
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    await act(async () => { await api!.removePost(anyPost); });
    expect(listPosts).toHaveBeenCalledWith("ghp_tok");
    expect(deletePost).toHaveBeenCalledWith("ghp_tok", path, "sha_f");
    expect(api!.hiddenSlugs.has(anyPost.slug)).toBe(true);
    expect(api!.visiblePosts.some((p) => p.slug === anyPost.slug)).toBe(false);
    expect(JSON.parse(localStorage.getItem("hazem-hidden-posts") || "[]")).toContain(anyPost.slug);
    expect(api!.mgrOk).toContain("Deleted");
  });

  it("removePost does nothing when the confirmation is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    await act(async () => { await api!.removePost(anyPost); });
    expect(listPosts).not.toHaveBeenCalled();
    expect(deletePost).not.toHaveBeenCalled();
    expect(api!.hiddenSlugs.has(anyPost.slug)).toBe(false);
  });

  it("removePost reports a missing file in the repo", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => fetchOk(OWNER_USER)));
    listPosts.mockResolvedValue([]);
    renderProvider();
    await act(async () => { await api!.unlock("ghp_tok"); });
    await act(async () => { await api!.removePost(anyPost); });
    expect(deletePost).not.toHaveBeenCalled();
    expect(api!.mgrErr).toContain(`Could not find ${POSTS_DIR}/${anyPost.slug}.mdx`);
  });

  it("hidden posts persist across providers", () => {
    localStorage.setItem("hazem-hidden-posts", JSON.stringify([anyPost.slug]));
    renderProvider();
    expect(api!.visiblePosts.some((p) => p.slug === anyPost.slug)).toBe(false);
    expect(api!.hiddenSlugs.has(anyPost.slug)).toBe(true);
  });
});