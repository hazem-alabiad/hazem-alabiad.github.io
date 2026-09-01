import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toast } from "./Toast";
import { BackToTop } from "./BackToTop";
import { Reveal } from "./Reveal";
import { BgGlyphs } from "./BgGlyphs";

describe("Toast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders the message", () => {
    render(<Toast message="Saved!" onClose={() => {}} />);
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("auto-dismisses after the timeout", () => {
    const onClose = vi.fn();
    render(<Toast message="Saved!" onClose={onClose} />);
    act(() => { vi.advanceTimersByTime(2600); });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("BackToTop", () => {
  it("is hidden until the user scrolls past 400px", () => {
    render(<BackToTop />);
    expect(screen.queryByRole("button", { name: /back to top/i })).not.toBeInTheDocument();
    Object.defineProperty(window, "scrollY", { value: 600, configurable: true });
    fireEvent.scroll(window);
    expect(screen.getByRole("button", { name: /back to top/i })).toBeInTheDocument();
    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    fireEvent.scroll(window);
    expect(screen.queryByRole("button", { name: /back to top/i })).not.toBeInTheDocument();
  });

  it("scrolls to the top when clicked", () => {
    Object.defineProperty(window, "scrollY", { value: 600, configurable: true });
    const scrollTo = vi.fn();
    Object.defineProperty(window, "scrollTo", { value: scrollTo, configurable: true });
    render(<BackToTop />);
    fireEvent.scroll(window);
    fireEvent.click(screen.getByRole("button", { name: /back to top/i }));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });
});

describe("Reveal", () => {
  it("adds the 'in' class when IntersectionObserver is absent (progressive enhancement)", () => {
    const io = globalThis.IntersectionObserver;
    delete (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
    try {
      render(<Reveal><p>content</p></Reveal>);
      const el = screen.getByText("content").closest(".reveal")!;
      expect(el.classList.contains("in")).toBe(true);
    } finally {
      (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = io;
    }
  });

  it("keeps the wrapper classNames and style", () => {
    render(<Reveal className="extra" style={{ color: "red" }}><span>hi</span></Reveal>);
    const el = screen.getByText("hi").closest(".reveal") as HTMLElement;
    expect(el.className).toContain("reveal extra");
    expect(el.style.color).toBe("red");
  });
});

describe("BgGlyphs", () => {
  it("renders the decorative glyph layer", () => {
    render(<BgGlyphs />);
    const layer = document.querySelector(".bg-glyphs")!;
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer.querySelectorAll("span").length).toBe(18);
  });
});