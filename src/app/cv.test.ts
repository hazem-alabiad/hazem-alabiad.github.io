import { describe, expect, it } from "vitest";
import { canShowEditContent, resolveCvHref, resolveCvName } from "./cv";

describe("CV link helpers", () => {
  it("prefers uploaded file data when available", () => {
    const hero = { cvFileData: "data:application/pdf;base64,abc", cvUrl: "https://example.com/cv.pdf", cvFileName: "my-cv.pdf" };
    expect(resolveCvHref(hero, "fallback.pdf")).toBe("data:application/pdf;base64,abc");
    expect(resolveCvName(hero, "fallback.pdf")).toBe("my-cv.pdf");
  });

  it("falls back to the URL or default asset", () => {
    const hero = { cvUrl: "https://example.com/cv.pdf" };
    expect(resolveCvHref(hero, "fallback.pdf")).toBe("https://example.com/cv.pdf");
    expect(resolveCvName(hero, "fallback.pdf")).toBe("resume.pdf");
  });

  it("shows edit content for signed-in owners or local development hosts", () => {
    expect(canShowEditContent({ hostname: "localhost", isSignedIn: false })).toBe(true);
    expect(canShowEditContent({ hostname: "127.0.0.1", isSignedIn: false })).toBe(true);
    expect(canShowEditContent({ hostname: "hazem-alabiad.github.io", isSignedIn: false })).toBe(false);
    expect(canShowEditContent({ hostname: "hazem-alabiad.github.io", isSignedIn: true })).toBe(true);
  });
});
