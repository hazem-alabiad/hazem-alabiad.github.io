import { describe, it, expect, beforeEach } from "vitest";
import { loadContent, saveContent, resetContent, uid, CMS_STORE_KEY, DEFAULT_CONTENT } from "./cms";

beforeEach(() => window.localStorage.clear());

describe("cms content store", () => {
  it("loadContent returns a deep copy of the defaults when nothing is stored", () => {
    const c = loadContent();
    expect(c).toEqual(DEFAULT_CONTENT);
    expect(c).not.toBe(DEFAULT_CONTENT);
  });

  it("loadContent merges stored overrides over defaults", () => {
    saveContent({ ...DEFAULT_CONTENT, heroTagline: "Override" });
    const c = loadContent();
    expect(c.heroTagline).toBe("Override");
    expect(c.experience.length).toBe(DEFAULT_CONTENT.experience.length);
  });

  it("loadContent falls back to defaults on corrupt JSON", () => {
    window.localStorage.setItem(CMS_STORE_KEY, "{nope");
    expect(loadContent().heroTagline).toBe(DEFAULT_CONTENT.heroTagline);
  });

  it("saveContent persists and resetContent clears the store", () => {
    saveContent({ ...DEFAULT_CONTENT, footerLine: "custom" });
    expect(JSON.parse(window.localStorage.getItem(CMS_STORE_KEY)!).footerLine).toBe("custom");
    resetContent();
    expect(window.localStorage.getItem(CMS_STORE_KEY)).toBeNull();
    expect(loadContent().footerLine).toBe(DEFAULT_CONTENT.footerLine);
  });

  it("uid returns a short unique-ish string", () => {
    const a = uid();
    const b = uid();
    expect(a).toMatch(/^[a-z0-9]{6}$/);
    expect(a).not.toBe(b);
  });
});