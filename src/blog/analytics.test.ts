import { describe, it, expect, beforeEach } from "vitest";
import { readViews, trackView, totalViews } from "./analytics";

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("blog analytics", () => {
  it("readViews returns {} when nothing stored or invalid JSON", () => {
    expect(readViews()).toEqual({});
    window.localStorage.setItem("hazem_blog_views", "{not json");
    expect(readViews()).toEqual({});
  });

  it("does not count on localhost (dev)", () => {
    Object.defineProperty(window, "location", { value: { hostname: "localhost" }, configurable: true });
    expect(trackView("post:a")).toEqual({});
    expect(readViews()).toEqual({});
  });

  it("counts once per session on production", () => {
    Object.defineProperty(window, "location", { value: { hostname: "hazem-alabiad.github.io" }, configurable: true });
    const first = trackView("post:a");
    expect(first["post:a"]).toBe(1);
    // second call in the same session does not re-count
    const second = trackView("post:a");
    expect(second["post:a"]).toBe(1);
    expect(window.sessionStorage.getItem("hazem_blog_session")).toBe("1");
  });

  it("skips counting when the owner flag is set", () => {
    Object.defineProperty(window, "location", { value: { hostname: "example.com" }, configurable: true });
    window.localStorage.setItem("hazem_owner", "1");
    expect(trackView("post:a")).toEqual({});
  });

  it("totalViews sums all counters", () => {
    expect(totalViews({ "post:a": 2, "post:b": 3 })).toBe(5);
    expect(totalViews({})).toBe(0);
  });
});