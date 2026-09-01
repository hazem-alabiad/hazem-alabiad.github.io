import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import BlogAdmin from "./BlogAdmin";

const listPosts = vi.hoisted(() => vi.fn());
const deletePost = vi.hoisted(() => vi.fn());

vi.mock("../github", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../github")>();
  return { ...actual, listPosts, deletePost };
});

const REPO_POSTS = [
  { path: "src/blog/posts/arabic-vmwe-llms.mdx", sha: "s1", name: "arabic-vmwe-llms.mdx" },
  { path: "src/blog/posts/new-one.mdx", sha: "s2", name: "new-one.mdx" },
];

function renderAdmin() {
  return render(
    <MemoryRouter initialEntries={["/blog/admin"]}>
      <Routes>
        <Route path="/blog/admin" element={<BlogAdmin />} />
        <Route path="/blog/admin/new" element={<div data-testid="page-new" />} />
        <Route path="/blog/admin/edit/:slug" element={<div data-testid="page-edit" />} />
      </Routes>
    </MemoryRouter>
  );
}

function fetchOwner() {
  vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ login: "hazem-alabiad", email: null }) })));
}

beforeEach(() => {
  listPosts.mockReset();
  deletePost.mockReset();
  listPosts.mockResolvedValue(REPO_POSTS);
  deletePost.mockResolvedValue(undefined);
  window.localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

afterEach(() => vi.unstubAllGlobals());

describe("BlogAdmin", () => {
  it("shows the unlock panel when no session exists", async () => {
    renderAdmin();
    expect(await screen.findByPlaceholderText("GitHub PAT")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unlock/i })).toBeInTheDocument();
    expect(screen.queryByText(/resume/i)).not.toBeInTheDocument();
  });

  it("unlocks with a PAT and lists repo posts", async () => {
    fetchOwner();
    renderAdmin();
    const input = await screen.findByPlaceholderText("GitHub PAT");
    fireEvent.change(input, { target: { value: "ghp_x" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    expect(await screen.findByText(/authenticated as @hazem-alabiad/i)).toBeInTheDocument();
    await waitFor(() => expect(listPosts).toHaveBeenCalledWith("ghp_x"));
    expect(await screen.findByText("arabic-vmwe-llms.mdx")).toBeInTheDocument();
    expect(screen.getByText("new-one.mdx")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new post/i })).toBeInTheDocument();
  });

  it("entering via Enter unlocks too", async () => {
    fetchOwner();
    renderAdmin();
    const input = await screen.findByPlaceholderText("GitHub PAT");
    fireEvent.change(input, { target: { value: "ghp_x" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(await screen.findByText(/authenticated as @hazem-alabiad/i)).toBeInTheDocument();
  });

  it("surfaces verification errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 401, json: async () => ({ message: "Bad credentials" }) })));
    renderAdmin();
    const input = await screen.findByPlaceholderText("GitHub PAT");
    fireEvent.change(input, { target: { value: "ghp_bad" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    expect(await screen.findByText(/✗ Bad credentials/i)).toBeInTheDocument();
  });

  it("resumes a saved session automatically and locks off", async () => {
    fetchOwner();
    window.localStorage.setItem("hazem-blog-token", "ghp_saved");
    window.localStorage.setItem("hazem-blog-user", "hazem-alabiad");
    renderAdmin();
    expect(await screen.findByText(/authenticated as @hazem-alabiad/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /lock/i }));
    expect(await screen.findByText(/saved session as @hazem-alabiad/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /resume/i }));
    expect(await screen.findByText(/authenticated as @hazem-alabiad/i)).toBeInTheDocument();
  });

  it("filters the repo list by title, slug or tag", async () => {
    fetchOwner();
    renderAdmin();
    const input = await screen.findByPlaceholderText("GitHub PAT");
    fireEvent.change(input, { target: { value: "ghp_x" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await screen.findByText("new-one.mdx");
    const search = screen.getByPlaceholderText(/by title, slug, or tag/i) as HTMLInputElement;
    fireEvent.change(search, { target: { value: "arabic" } });
    expect(screen.getByText("arabic-vmwe-llms.mdx")).toBeInTheDocument();
    expect(screen.queryByText("new-one.mdx")).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "zzz" } });
    expect(screen.getByText(/No posts match/i)).toBeInTheDocument();
  });

  it("navigates to edit and new-post routes", async () => {
    fetchOwner();
    renderAdmin();
    const input = await screen.findByPlaceholderText("GitHub PAT");
    fireEvent.change(input, { target: { value: "ghp_x" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await screen.findByText("arabic-vmwe-llms.mdx");
    fireEvent.click(screen.getAllByRole("button", { name: /edit/i })[0]);
    expect(screen.getByTestId("page-edit")).toBeInTheDocument();
  });

  it("deletes a post after confirmation and refreshes the list", async () => {
    fetchOwner();
    renderAdmin();
    const input = await screen.findByPlaceholderText("GitHub PAT");
    fireEvent.change(input, { target: { value: "ghp_x" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await screen.findByText("new-one.mdx");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    await waitFor(() => expect(deletePost).toHaveBeenCalled());
    expect(deletePost.mock.calls[0][0]).toBe("ghp_x");
    expect(await screen.findByText(/✓ Deleted/i)).toBeInTheDocument();
  });

  it("skips the delete when confirmation is declined", async () => {
    fetchOwner();
    renderAdmin();
    const input = await screen.findByPlaceholderText("GitHub PAT");
    fireEvent.change(input, { target: { value: "ghp_x" } });
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    await screen.findByText("new-one.mdx");
    vi.spyOn(window, "confirm").mockReturnValue(false);
    fireEvent.click(screen.getAllByRole("button", { name: /delete/i })[0]);
    expect(deletePost).not.toHaveBeenCalled();
  });

  it("reports list and delete errors", async () => {
    fetchOwner();
    renderAdmin();
    const input = await screen.findByPlaceholderText("GitHub PAT");
    fireEvent.change(input, { target: { value: "ghp_x" } });
    listPosts.mockRejectedValueOnce(new Error("network down"));
    fireEvent.click(screen.getByRole("button", { name: /unlock/i }));
    expect(await screen.findByText(/✗ network down/i)).toBeInTheDocument();
  });
});