import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BlogIndex } from "./Blog";
import { PostEditorPage } from "./PostEditor";
import type { BlogManagerValue } from "./manager";

const mock = vi.hoisted<{ mgr: BlogManagerValue }>(() => ({
  mgr: {
    mgr: { login: "hazem-alabiad" },
    token: "tok",
    unlockOpen: false,
    setUnlockOpen: vi.fn(),
    pat: "",
    setPat: vi.fn(),
    unlock: vi.fn(async () => undefined),
    restore: vi.fn(async () => true),
    lock: vi.fn(),
    publishing: false,
    mgrErr: "",
    mgrOk: "",
    authBusy: false,
    authErr: "",
    hiddenSlugs: new Set<string>(),
    visiblePosts: [],
    loadPostDraft: vi.fn(async (slug: string) => ({ isNew: false, slug, path: `content/blog/${slug}.mdx`, title: `Loaded ${slug}`, date: "2026-08-01", description: "d", tags: [], accent: "amber", author: "hazem-alabiad", body: "# body" })),
    publishDraft: vi.fn(async () => undefined),
    removePost: vi.fn(async () => undefined),
  },
}));

vi.mock("./manager", () => ({
  useBlogManager: () => mock.mgr,
  BlogManagerProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function renderBlogRoutes() {
  return render(
    <MemoryRouter initialEntries={["/blog"]}>
      <Routes>
        <Route path="/blog" element={<BlogIndex onOpen={() => {}} />} />
        <Route path="/blog/admin/new" element={<div data-testid="page-new" />} />
        <Route path="/blog/admin/edit/:slug" element={<div data-testid="page-edit" />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("blog editor routing", () => {
  beforeEach(() => {
    mock.mgr.mgr = { login: "hazem-alabiad" };
    mock.mgr.token = "tok";
    mock.mgr.mgrErr = "";
    mock.mgr.mgrOk = "";
    mock.mgr.publishing = false;
    mock.mgr.visiblePosts = [];
    (mock.mgr.loadPostDraft as ReturnType<typeof vi.fn>).mockClear();
    (mock.mgr.publishDraft as ReturnType<typeof vi.fn>).mockClear();
    (mock.mgr.restore as ReturnType<typeof vi.fn>).mockClear();
  });

  it("NEW POST navigates to the dedicated /blog/admin/new page", () => {
    renderBlogRoutes();
    fireEvent.click(screen.getByRole("button", { name: /new post/i }));
    expect(screen.getByTestId("page-new")).toBeInTheDocument();
  });

  it("the card edit control navigates to /blog/admin/edit/<slug>", () => {
    mock.mgr.visiblePosts = [
      { slug: "arabic-vmwe-llms", title: "Arabic LLMs", description: "on arabic llms", date: "2026-08-01", tags: ["nlp"], accent: "amber", Component: () => null },
    ];
    renderBlogRoutes();
    fireEvent.click(screen.getByRole("button", { name: /edit arabic-vmwe-llms/i }));
    expect(screen.getByTestId("page-edit")).toBeInTheDocument();
  });

  it("the new-post page renders the full editor (no inline form on the blog index)", () => {
    render(<MemoryRouter initialEntries={["/blog/admin/new"]}><Routes><Route path="/blog/admin/new" element={<PostEditorPage mode="new" />} /></Routes></MemoryRouter>);
    expect(screen.getByText("NEW POST · WRITE A NOTE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publish post/i })).toBeInTheDocument();
    expect(screen.queryByText(/github pat/i)).not.toBeInTheDocument();
  });

  it("the edit page loads the post from the repo and prefills the editor", async () => {
    render(<MemoryRouter initialEntries={["/blog/admin/edit/arabic-vmwe-llms"]}><Routes><Route path="/blog/admin/edit/:slug" element={<PostEditorPage mode="edit" />} /></Routes></MemoryRouter>);
    expect(screen.getByText(/EDITING · arabic-vmwe-llms/i)).toBeInTheDocument();
    await waitFor(() => expect(mock.mgr.loadPostDraft).toHaveBeenCalledWith("arabic-vmwe-llms"));
    expect(await screen.findByDisplayValue("Loaded arabic-vmwe-llms")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save post/i })).toBeInTheDocument();
  });

  it("an unauthenticated visitor sees the unlock panel instead of the editor", () => {
    mock.mgr.mgr = null;
    mock.mgr.token = null;
    render(<MemoryRouter initialEntries={["/blog/admin/new"]}><Routes><Route path="/blog/admin/new" element={<PostEditorPage mode="new" />} /></Routes></MemoryRouter>);
    expect(screen.getByPlaceholderText("GitHub PAT")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /publish post/i })).not.toBeInTheDocument();
  });

  it("shows the load error when fetching the post fails", async () => {
    mock.mgr.mgr = { login: "hazem-alabiad" };
    mock.mgr.token = "tok";
    (mock.mgr.loadPostDraft as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("read failed"));
    render(<MemoryRouter initialEntries={["/blog/admin/edit/arabic-vmwe-llms"]}><Routes><Route path="/blog/admin/edit/:slug" element={<PostEditorPage mode="edit" />} /></Routes></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: /could not load this post/i })).toBeInTheDocument();
    expect(screen.getByText("read failed")).toBeInTheDocument();
  });

  it("publishes through the manager and surfaces errors", async () => {
    mock.mgr.mgrErr = "boom";
    render(<MemoryRouter initialEntries={["/blog/admin/new"]}><Routes><Route path="/blog/admin/new" element={<PostEditorPage mode="new" />} /></Routes></MemoryRouter>);
    (mock.mgr.publishDraft as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("boom"));
    fireEvent.click(screen.getByRole("button", { name: /publish post/i }));
    await waitFor(() => expect(mock.mgr.publishDraft).toHaveBeenCalled());
    expect(screen.getByText("✗ boom")).toBeInTheDocument();
  });

  it("cancel returns to the blog list", () => {
    render(<MemoryRouter initialEntries={["/blog/admin/new"]}><Routes>
      <Route path="/blog/admin/new" element={<PostEditorPage mode="new" />} />
      <Route path="/blog" element={<div data-testid="page-blog" />} />
    </Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByTestId("page-blog")).toBeInTheDocument();
  });
});
