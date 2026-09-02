import type { Root, Blockquote, Paragraph, Text } from "mdast";
import { visit } from "unist-util-visit";

/**
 * GFM-style callouts: `> [!NOTE] …` / `> [!TIP] …` / `> [!WARNING] …`
 *
 * A remark plugin that rewrites the marker blockquote into an ordinary
 * blockquote with a `data-callout="<kind>"` attribute and a leading paragraph
 * holding the eyebrow (mono `note`, `tip`, `warning`) so the same
 * mdast shape renders identically at MDX compile time (vite) and in the
 * editor's MarkdownPreview.
 */
const KINDS = new Set(["NOTE", "TIP", "WARNING", "IMPORTANT"]);

const EYEBROW: Record<string, string> = {
  NOTE: "note",
  TIP: "tip",
  WARNING: "warning",
  IMPORTANT: "important",
};

function isText(n: unknown): n is Text {
  return Boolean(n && typeof n === "object" && (n as Text).type === "text");
}

function isParagraph(n: unknown): n is Paragraph {
  return Boolean(n && typeof n === "object" && (n as Paragraph).type === "paragraph");
}

/** Split a paragraph's leading text node at `[!KIND]` and return the kind. */
function markerOf(p: Paragraph): string | null {
  const first = p.children[0];
  if (!isText(first)) return null;
  const m = first.value.match(/^\s*\[!\s*([A-Z]+)\s*\]\s*/);
  if (!m || !KINDS.has(m[1])) return null;
  first.value = first.value.slice(m[0].length);
  return m[1];
}

export function remarkCallout() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      // only bare blockquotes: `> [!NOTE]` — no nesting, no attribution line
      if (node.children.length !== 1) return;
      const p = node.children[0];
      if (!isParagraph(p)) return;
      const kind = markerOf(p);
      if (!kind) return;
      p.children = p.children.filter((c) => !(isText(c) && c.value.trim() === ""));
      node.data = {
        hProperties: { "data-callout": kind.toLowerCase(), className: ["blog-callout"] },
      };
      const eyebrow: Text = { type: "text", value: EYEBROW[kind] };
      node.children = [{ type: "paragraph", children: [eyebrow] }, ...node.children];
    });
  };
}