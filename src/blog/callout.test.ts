import { describe, it, expect } from "vitest";
import { fromMarkdown } from "mdast-util-from-markdown";
import { toHast } from "mdast-util-to-hast";
import { remarkCallout } from "./callout";

function renderCallouts(src: string) {
  const tree = fromMarkdown(src);
  remarkCallout()(tree as never);
  return toHast(tree as never);
}

function findCallouts(hast: any): any[] {
  const out: any[] = [];
  const walk = (n: any) => {
    if (n?.type === "element" && n?.tagName === "blockquote") out.push(n);
    (n?.children || []).forEach(walk);
  };
  walk(hast);
  return out;
}

/** the paragraph elements inside a blockquote (skips the inter-node newline text) */
function parasOf(bq: any): any[] {
  return (bq?.children || []).filter((c: any) => c.type === "element" && c.tagName === "p");
}

describe("remarkCallout", () => {
  it("turns a [!NOTE] marker into a data-callout blockquote with a `$ note` eyebrow", () => {
    const hast = renderCallouts("> [!NOTE]\n> Keep the conversion outside the model.");
    const [cq] = findCallouts(hast);
    expect(cq).toBeDefined();
    expect(cq.properties?.["data-callout"]).toBe("note");
    expect(cq.properties?.className).toContain("blog-callout");
    const paras = parasOf(cq);
    expect(paras[0]?.children?.[0]?.type === "text" && paras[0].children[0].value).toBe("$ note");
    expect(paras[1]?.children?.[0]?.value).toContain("Keep the conversion");
  });

  it("supports TIP and WARNING kinds with matching eyebrows", () => {
    const hast = renderCallouts("> [!TIP] Prefer the smaller reach.\n\n> [!WARNING] Do not store the token.");
    const [tip, warn] = findCallouts(hast);
    expect(tip.properties["data-callout"]).toBe("tip");
    expect(warn.properties["data-callout"]).toBe("warning");
    expect(parasOf(tip)[0].children[0].value).toBe("$ tip");
    expect(parasOf(warn)[0].children[0].value).toBe("$ warning");
  });

  it("leaves ordinary blockquotes alone", () => {
    const hast = renderCallouts("> A plain quote, no marker.");
    const [bq] = findCallouts(hast);
    expect(bq.properties?.["data-callout"]).toBeUndefined();
    expect(parasOf(bq)[0].children[0].value).not.toMatch(/^\$/);
  });

  it("keeps inline content inside the callout paragraph", () => {
    const hast = renderCallouts("> [!NOTE] **Heavy:** read the **source** first.");
    const [cq] = findCallouts(hast);
    const body = parasOf(cq).find((c: any) => JSON.stringify(c.children).includes("Heavy"));
    expect(JSON.stringify(body?.children || [])).toContain("strong");
  });
});