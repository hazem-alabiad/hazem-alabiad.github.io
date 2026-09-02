import { render, screen, fireEvent, within, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { BlogIndex, BlogPost } from "./Blog";
import type { Post } from "./posts";
import type { BlogManagerValue } from "./manager";

// Test helpers for the deep-link restore: the real code waits while the
// boot-screen overlay (a fixed full-viewport div, `data-boot-screen`) is up,
// because that overlay clamps scroll and its unmount shifts the position out
// of view. Tests drive the actual implementation with DOM fixtures + fake timers.
const bootFixture = { el: null as HTMLDivElement | null, present: false };
function setBootFixture(present: boolean) {
  if (present && !bootFixture.el) {
    const d = document.createElement("div");
    d.setAttribute("data-boot-screen", "");
    d.style.position = "fixed";
    d.style.inset = "0";
    d.style.zIndex = "99999";
    document.body.appendChild(d);
    bootFixture.el = d;
    bootFixture.present = true;
  } else if (!present) {
    removeBootFixture();
  }
}
function removeBootFixture() {
  bootFixture.el?.remove();
  bootFixture.el = null;
  bootFixture.present = false;
}

const mock = vi.hoisted<{ mgr: BlogManagerValue }>(() => ({
  mgr: {
    mgr: null,
    token: null,
    unlockOpen: false,
    setUnlockOpen: vi.fn((v: boolean) => { mock.mgr.unlockOpen = v; state.rerender(); }),
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
    loadPostDraft: vi.fn(async () => ({ isNew: true, slug: "", path: "", title: "", date: "", description: "", tags: [], accent: "amber", author: "hazem-alabiad", body: "" })),
    publishDraft: vi.fn(async () => undefined),
    removePost: vi.fn(async () => undefined),
  },
}));

const state = vi.hoisted(() => ({ rerender: () => {} }));

// Mock the blog-manager so tests can fully control its value. The hook is
// stateful so mutations via the mock's own setters re-render the components.
vi.mock("./manager", async () => {
  const React = (await import("react")) as typeof import("react");
  return {
    useBlogManager: () => {
      const [, set] = React.useState(0);
      state.rerender = () => set((n) => n + 1);
      return mock.mgr;
    },
    BlogManagerProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

const FAKE = [
  { slug: "arabic-vmwe-llms", title: "Arabic LLMs", description: "on arabic llms and low-resource nlp", date: "2026-07-18", tags: ["nlp", "arabic"], accent: "amber" as const, Component: () => <p>body-a</p> },
  { slug: "shipping-notes", title: "Shipping Notes", description: "notes on shipping software", date: "2026-01-02", tags: ["engineering"], accent: "violet" as const, Component: () => <p>body-b</p> },
] as Post[];

describe("BlogIndex", () => {
  beforeEach(() => {
    mock.mgr.mgr = null;
    mock.mgr.token = null;
    mock.mgr.mgrErr = "";
    mock.mgr.mgrOk = "";
    mock.mgr.unlockOpen = false;
    mock.mgr.visiblePosts = FAKE;
    mock.mgr.hiddenSlugs = new Set();
  });

  function renderIndex(slug?: string) {
    const opened = vi.fn();
    const view = render(
      <MemoryRouter initialEntries={[slug || "/blog"]}>
        <Routes>
          <Route path="/blog" element={<BlogIndex onOpen={opened} />} />
          <Route path="/blog/admin/new" element={<div data-testid="page-new" />} />
          <Route path="/blog/admin/edit/:slug" element={<div data-testid="page-edit" />} />
        </Routes>
      </MemoryRouter>
    );
    return { view, opened };
  }

  it("renders the section header, lede count and all visible cards", () => {
    renderIndex();
    expect(screen.getByRole("heading", { name: /notes.*ideas/i })).toBeInTheDocument();
    expect(screen.getByText(/2 posts/i)).toBeInTheDocument();
    expect(screen.getByText("Arabic LLMs")).toBeInTheDocument();
    expect(screen.getByText("Shipping Notes")).toBeInTheDocument();
    expect(screen.getAllByText("Read →")).toHaveLength(2);
  });

  it("filters and counts hits while typing, showing highlighted matches", () => {
    renderIndex();
    const input = screen.getByRole("textbox", { name: /search the blog/i });
    fireEvent.change(input, { target: { value: "llm" } });
    expect(screen.getByText("1 result")).toBeInTheDocument();
    expect(screen.getByText("LLM", { selector: "mark" })).toBeInTheDocument();
    expect(screen.queryByText("Shipping Notes")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete arabic/i })).not.toBeInTheDocument();
  });

  it("searches descriptions and tags too", () => {
    renderIndex();
    const input = screen.getByRole("textbox", { name: /search the blog/i });
    fireEvent.change(input, { target: { value: "engineering" } });
    expect(screen.getByText("Shipping Notes")).toBeInTheDocument();
    expect(screen.queryByText("Arabic LLMs")).not.toBeInTheDocument();
  });

  it("shows an empty state with a working Clear search button", () => {
    renderIndex();
    const input = screen.getByRole("textbox", { name: /search the blog/i });
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText(/no notes match/i)).toBeInTheDocument();
    const emptyBtn = screen.getByText(/no notes match/i).closest(".blog-empty")!.querySelector("button")!;
    fireEvent.click(emptyBtn);
    expect(input).toHaveValue("");
    expect(screen.getByText("Arabic LLMs")).toBeInTheDocument();
  });

  it("the esc affordance clears the query", () => {
    renderIndex();
    const input = screen.getByRole("textbox", { name: /search the blog/i });
    fireEvent.change(input, { target: { value: "llm" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("");
  });

  it("pressing '/' focuses the search input", () => {
    renderIndex();
    const input = screen.getByRole("textbox", { name: /search the blog/i });
    fireEvent.keyDown(window, { key: "/" });
    expect(document.activeElement).toBe(input);
  });

  it("arrow navigation + enter opens the active hit", () => {
    const { opened } = renderIndex();
    const input = screen.getByRole("textbox", { name: /search the blog/i });
    fireEvent.change(input, { target: { value: "shipping" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(screen.getByRole("status")).toHaveTextContent("1/1");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(opened).toHaveBeenCalledWith("shipping-notes");
  });

  it("clicking a card opens that post", () => {
    const { opened } = renderIndex();
    fireEvent.click(screen.getByText("Arabic LLMs"));
    expect(opened).toHaveBeenCalledWith("arabic-vmwe-llms");
  });

  it("shows NEW POST and per-card edit/delete controls when the owner is present", () => {
    mock.mgr.mgr = { login: "hazem-alabiad" };
    renderIndex();
    fireEvent.click(screen.getByRole("button", { name: /new post/i }));
    expect(screen.getByTestId("page-new")).toBeInTheDocument();
  });

  it("navigates to the edit route from a card and hides cards for hidden slugs", () => {
    mock.mgr.mgr = { login: "hazem-alabiad" };
    mock.mgr.hiddenSlugs = new Set(["shipping-notes"]);
    mock.mgr.visiblePosts = FAKE.filter((p) => p.slug !== "shipping-notes");
    renderIndex();
    fireEvent.click(screen.getByRole("button", { name: /edit arabic-vmwe-llms/i }));
    expect(screen.getByTestId("page-edit")).toBeInTheDocument();
    expect(screen.queryByText("Shipping Notes")).not.toBeInTheDocument();
  });

  it("the delete control calls removePost without opening the card", () => {
    mock.mgr.mgr = { login: "hazem-alabiad" };
    const { opened } = renderIndex();
    fireEvent.click(screen.getByRole("button", { name: /delete arabic-vmwe-llms/i }));
    expect(mock.mgr.removePost).toHaveBeenCalledWith(expect.objectContaining({ slug: "arabic-vmwe-llms" }));
    expect(opened).not.toHaveBeenCalled();
  });

  it("renders manager error and ok messages", () => {
    mock.mgr.mgrErr = "boom";
    mock.mgr.mgrOk = "saved";
    renderIndex();
    expect(screen.getByText("✗ boom")).toBeInTheDocument();
    expect(screen.getByText("✓ saved")).toBeInTheDocument();
  });

  it("renders tag filter chips with usage counts", () => {
    renderIndex();
    const chip = screen.getByRole("button", { name: /#arabic/i });
    expect(chip.textContent).toContain("1");
    expect(screen.getAllByRole("button", { name: /^#/i }).length).toBe(3);
  });

  it("filters the list by a tag chip and toggles it off", () => {
    renderIndex();
    fireEvent.click(screen.getByRole("button", { name: /#arabic/i }));
    expect(screen.getByText("Arabic LLMs")).toBeInTheDocument();
    expect(screen.queryByText("Shipping Notes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /#arabic/i })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /#arabic/i }));
    expect(screen.getByText("Shipping Notes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /#arabic/i })).toHaveAttribute("aria-pressed", "false");
  });
});

describe("BlogPost", () => {
  beforeEach(() => {
    mock.mgr.mgr = null;
    mock.mgr.token = null;
    mock.mgr.mgrErr = "";
    mock.mgr.mgrOk = "";
    mock.mgr.unlockOpen = false;
    mock.mgr.visiblePosts = FAKE;
    mock.mgr.hiddenSlugs = new Set();
    removeBootFixture();
    vi.useRealTimers();
  });

  afterEach(() => {
    removeBootFixture();
    vi.useRealTimers();
  });

  function renderPost(slug = "arabic-vmwe-llms") {
    return render(
      <MemoryRouter initialEntries={[`/blog/${slug}`]}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost slug={slug} onBack={() => {}} />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it("renders the masthead, title, lede and byline of the bundled post", async () => {
    renderPost();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Why LLMs Fumble Low-Resource Languages");
    expect(screen.getByText(/still miss them/i)).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: /reading tools/i })).toBeInTheDocument();
    expect(screen.getAllByText(/hazem-alabiad/i).length).toBeGreaterThanOrEqual(2);
    await waitFor(() => expect(screen.getByText(/min read/i)).toBeInTheDocument());
    expect(screen.getByText("0 views")).toBeInTheDocument();
  });

  it("builds the on-this-page index from rendered headings and jumps on click", async () => {
    renderPost();
    await waitFor(() => expect(screen.getAllByText("IN THIS NOTE").length).toBeGreaterThanOrEqual(1));
    const toc = screen.getAllByRole("navigation", { name: /sections/i })[0];
    const items = within(toc).getAllByRole("button");
    expect(items.length).toBeGreaterThanOrEqual(4);
    fireEvent.click(within(toc).getByRole("button", { name: "The direction I probe" }));
    await waitFor(() => expect(within(toc).getByRole("button", { name: "The direction I probe" })).toHaveAttribute("aria-current", "true"));
  });

  it("adds copy buttons and language chips to code blocks", async () => {
    renderPost();
    await waitFor(() => expect(screen.getByText("python", { selector: ".blog-code-lang" })).toBeInTheDocument());
    expect(screen.getByText("ts", { selector: ".blog-code-lang" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "copy" }).length).toBeGreaterThanOrEqual(2);
  });

  it("keeps the font scale buttons bounded to 16–20 and persisted", () => {
    renderPost();
    const plus = screen.getByRole("button", { name: /increase text size/i });
    const minus = screen.getByRole("button", { name: /decrease text size/i });
    // No numeric readout anymore — only A−/A+ remain
    expect(plus).toHaveTextContent("A+");
    expect(minus).toHaveTextContent("A−");
    fireEvent.click(plus);
    expect(JSON.parse(localStorage.getItem("hazem_font_scale") || "{}")).toBe(20);
    // 20 is the cap — the larger control disables and 22 no longer exists
    fireEvent.click(plus);
    expect(JSON.parse(localStorage.getItem("hazem_font_scale") || "{}")).toBe(20);
    expect(plus).toBeDisabled();
    fireEvent.click(minus);
    fireEvent.click(minus);
    expect(JSON.parse(localStorage.getItem("hazem_font_scale") || "{}")).toBe(16);
    expect(minus).toBeDisabled();
  });

  it("renders the breadcrumb, author card and comments region", async () => {
    renderPost();
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "notes" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "GitHub" })).toBeInTheDocument();
    expect(await screen.findByText("COMMENTS")).toBeInTheDocument();
  });

  it("restores the deep link immediately when no boot overlay is up", async () => {
    window.location.hash = "#/blog/is-a-route#what-the-llm-does";
    const scrollSpy = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollSpy;
    renderPost();
    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1));
    expect(scrollSpy.mock.calls[0][0]).toEqual({ block: "start" });
    window.location.hash = "";
  });

  it("holds the deep-link restore while the boot screen is up, then lands after dismissal", async () => {
    vi.useFakeTimers();
    const scrollSpy = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollSpy;
    window.location.hash = "#/blog/is-a-route#the-direction-i-probe";
    setBootFixture(true); // the boot overlay is up at mount
    renderPost();
    await act(async () => { await Promise.resolve(); });
    expect(document.getElementById("the-direction-i-probe")).toBeTruthy();
    expect(document.querySelector("[data-boot-screen]")).toBeTruthy();
    // a few retries pass while the overlay is still up → no scroll yet
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(scrollSpy).not.toHaveBeenCalled();
    // user dismisses the boot screen → next retry restores the anchor
    setBootFixture(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy.mock.calls[0][0]).toEqual({ block: "start" });
    window.location.hash = "";
    removeBootFixture();
  });

  it("shows Post not found for a missing slug", () => {
    renderPost("does-not-exist");
    expect(screen.getByRole("heading", { name: /post not found/i })).toBeInTheDocument();
  });

  it("shows the reading dock without owner tools or lock to readers", () => {
    mock.mgr.mgr = null;
    renderPost();
    // Share + text-size controls remain for everyone
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /increase text size/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /decrease text size/i })).toBeInTheDocument();
    // Owner-only tools and the old lock button are gone
    expect(screen.queryByRole("button", { name: /edit post/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete post/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /lock management/i })).not.toBeInTheDocument();
  });

  it("shows owner edit/delete tools separated from reader tools when verified", () => {
    mock.mgr.mgr = { login: "hazem-alabiad" };
    renderPost();
    expect(screen.getByRole("button", { name: "Edit post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete post" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
    // No lock anywhere in the article toolbar
    expect(screen.queryByRole("button", { name: /lock/i })).not.toBeInTheDocument();
  });

  it("marks the date with ISO markup and shows a read-next panel", async () => {
    renderPost();
    const t = document.querySelector("time.blog-article-date");
    expect(t).not.toBeNull();
    expect(t!.getAttribute("datetime")).toBeTruthy();
    expect(t!.getAttribute("title")).toBeTruthy();
    // read-next: the bundled post shares tags with other bundled notes
    const next = await screen.findByText(/read next/i);
    expect(next).toBeInTheDocument();
    const card = next.closest("a");
    expect(card).not.toBeNull();
    expect(card!.getAttribute("href")).toContain("#/blog/");
  });
});