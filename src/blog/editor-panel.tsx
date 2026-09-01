import { useEffect, useState, type ReactNode } from "react";
import { Save } from "lucide-react";
import MDEditor, { bold, italic, strikethrough, divider, title1, title2, title3, quote, codeBlock, unorderedListCommand, orderedListCommand, link, image } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import type { BlogDraft } from "./editor";

/* ── editor: a writing surface ────────────────────────────────────────────
   The page reads like the post itself: hero title, italic lede, a
   collapsible settings strip, then a full markdown editor with a live
   preview (toolbar + GFM rendering from @uiw/react-md-editor). Kept in its
   own module so the editor library only loads on the owner's editor route. */

const EDITOR_COMMANDS = [
  bold, italic, strikethrough, divider,
  title1, title2, title3, divider,
  quote, codeBlock, divider,
  unorderedListCommand, orderedListCommand, divider,
  link, image,
];

export function EditorPanel({ draft, onDraft, busy, onSave, onCancel }: {
  draft: BlogDraft;
  onDraft: (d: BlogDraft) => void;
  busy: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  // keep the markdown editor in sync with the site's light/dark theme
  const [colorMode, setColorMode] = useState<"light" | "dark">(() =>
    document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"
  );
  // on small screens start in full-width edit mode (preview stays one tap away)
  const [preview] = useState<"live" | "edit" | "preview">(() =>
    typeof window !== "undefined" && window.innerWidth < 700 ? "edit" : "live"
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setColorMode(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark")
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  const words = draft.body.trim().split(/\s+/).filter(Boolean).length;
  const readMin = Math.max(1, Math.round(words / 200));

  const cell = (label: string, node: ReactNode) => (
    <label className="blog-editor-cell">
      <span className="blog-editor-cell-label">{label}</span>
      {node}
    </label>
  );

  return (
    <div className="blog-editor">
      <input
        className="blog-editor-title"
        value={draft.title}
        placeholder="Untitled note"
        aria-label="Post title"
        onChange={(e) => onDraft({ ...draft, title: e.target.value })}
      />
      <input
        className="blog-editor-desc"
        value={draft.description}
        placeholder="One line on what this note is about."
        aria-label="Post description"
        onChange={(e) => onDraft({ ...draft, description: e.target.value })}
      />

      <details className="blog-editor-settings">
        <summary className="blog-editor-settings-summary">
          POST SETTINGS <span className="blog-editor-settings-hint">slug · date · tags · accent</span>
        </summary>
        <div className="blog-editor-meta">
          {cell("SLUG", <input className="blog-editor-meta-input" value={draft.slug} placeholder={draft.isNew ? "auto from title" : "slug"} aria-label="Slug" onChange={(e) => onDraft({ ...draft, slug: e.target.value })} />)}
          {cell("DATE", <input className="blog-editor-meta-input" type="date" value={draft.date} aria-label="Date" onChange={(e) => onDraft({ ...draft, date: e.target.value })} />)}
          {cell("TAGS", <input className="blog-editor-meta-input" value={draft.tags.join(", ")} placeholder="comma separated" aria-label="Tags" onChange={(e) => onDraft({ ...draft, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />)}
          {cell("ACCENT", (
            <select className="blog-editor-meta-input" value={draft.accent} aria-label="Accent color" onChange={(e) => onDraft({ ...draft, accent: e.target.value })}>
              <option value="amber">amber</option>
              <option value="sage">sage</option>
              <option value="violet">violet</option>
              <option value="pink">pink</option>
            </select>
          ))}
        </div>
      </details>

      <MDEditor
        value={draft.body}
        onChange={(v) => onDraft({ ...draft, body: v ?? "" })}
        preview={preview}
        height={560}
        visibleDragbar={false}
        commands={EDITOR_COMMANDS}
        textareaProps={{ placeholder: "Write in markdown — or use the toolbar above.", "aria-label": "Post body (markdown)" }}
        data-color-mode={colorMode}
      />

      <div className="blog-editor-foot">
        <span className="blog-editor-stats">{words} words · ~{readMin} min read</span>
        <span className="blog-editor-actions">
          <button type="button" className="blog-editor-btn" onClick={onCancel} disabled={busy}>CANCEL</button>
          <button type="button" className="blog-editor-btn blog-editor-btn--primary" onClick={onSave} disabled={busy}>
            <Save size={12} /> {busy ? "SAVING…" : draft.isNew ? "PUBLISH POST" : "SAVE POST"}
          </button>
        </span>
      </div>
    </div>
  );
}
