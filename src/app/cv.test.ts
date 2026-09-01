import { describe, it, expect } from "vitest";
import { resolveCvHref, resolveCvName } from "./cv";

describe("cv resolvers", () => {
  it("prefers data URL, then URL, then the bundled href", () => {
    expect(resolveCvHref({ cvDataUrl: "data:pdf", cvUrl: "https://x/cv.pdf" }, "bundled.pdf")).toBe("data:pdf");
    expect(resolveCvHref({ cvUrl: "https://x/cv.pdf" }, "bundled.pdf")).toBe("https://x/cv.pdf");
    expect(resolveCvHref({}, "bundled.pdf")).toBe("bundled.pdf");
  });

  it("prefers the CMS file name and falls back", () => {
    expect(resolveCvName({ cvFileName: "my-cv.pdf" }, "fallback.pdf")).toBe("my-cv.pdf");
    expect(resolveCvName({}, "fallback.pdf")).toBe("fallback.pdf");
  });
});