import { useEffect, useState, type ReactNode } from "react";
import { Check, Edit3, Eye, Info, Save } from "lucide-react";
import MDEditor, { bold, italic, strikethrough, divider, title1, title2, title3, quote, codeBlock, unorderedListCommand, orderedListCommand, link, image, type ICommand } from "@uiw/react-md-editor";
import MarkdownPreview from "@uiw/react-markdown-preview";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import type { BlogDraft } from "./editor";
import { remarkCallout } from "./callout";

export type SaveState = "idle" | "saving" | "saved" | "error";

// tag universe for the autocomplete datalist. Keep in sync with the tags
// used across posts/*.mdx (the full post loader is too heavy for the
// editor route's lazy chunk).
const TAG_SUGGESTIONS = [
  "NLP", "Arabic", "Data", "LLMs", "Compling",
  "Engineering", "Process", "Reviews", "Product", "Linguistics", "MT",
];

/* ── editor: a writing surface ────────────────────────────────────────────
   The page reads like the post itself: hero title, italic lede, a
   collapsible settings strip, then a markdown editor. A WRITE / PREVIEW
   mode switch shows the draft as the published article would render it
   (same .blog-prose typography). Kept in its own module so the editor
   library only loads on the owner's editor route. */

// insert a `> [!NOTE]` callout — the same marker the read page renders
// (remark plugin shared with the vite MDX build), so what you write in the
// editor is exactly what publishes.
const callout: ICommand = {
  name: "callout",
  keyCommand: "callout",
  buttonProps: { "aria-label": "Insert callout", title: "Insert callout", type: "button" },
  icon: <Info size={12} />,
  execute: (state, api) => {
    const sel = state.selectedText || "";
    const line = sel.replace(/\n+/g, " ").trim();
    api.replaceSelection(`\n\n> [!NOTE] ${line}${line ? "" : "Write a short note…"}\n`);
  },
};

const EDITOR_COMMANDS = [
  bold, italic, strikethrough, divider,
  title1, title2, title3, divider,
  quote, callout, codeBlock, divider,
  unorderedListCommand, orderedListCommand, divider,
  link, image,
];

export function EditorPanel({ draft, onDraft, busy, saveState, onSave, onCancel }: {
  draft: BlogDraft;
  onDraft: (d: BlogDraft) => void;
  busy: boolean;
  saveState: SaveState;
  onSave: () => void;
  onCancel: () => void;
}) {
  // keep the markdown editor in sync with the site's light/dark theme
  const [colorMode, setColorMode] = useState<"light" | "dark">(() =>
    document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark"
  );
  // WRITE = the markdown surface; SPLIT = source + rendered pane side by side
  // (the library's live preview anchors both panes to the same line);
  // PREVIEW = the rendered article, full-height
  const [view, setView] = useState<"write" | "split" | "preview">("write");

  // tag chip input: draft text + commit on Enter/comma/blur
  const [tagInput, setTagInput] = useState("");
  const addTag = (raw: string) => {
    const next = raw.split(/[,\s]+/).map((t) => t.trim()).filter(Boolean);
    if (!next.length) return;
    const merged = next.filter((t) => !draft.tags.includes(t));
    if (merged.length) onDraft({ ...draft, tags: [...draft.tags, ...merged] });
    setTagInput("");
  };
  const commitTags = () => { if (tagInput.trim()) addTag(tagInput); };

  // editor body font size — comfort reading while drafting
  const EDIT_FONT_KEY = "hazem_editor_font";
  const EDIT_FONTS = [14, 15.5, 17];
  const [editFont, setEditFont] = useState<number>(() => {
    try { const s = Number(localStorage.getItem(EDIT_FONT_KEY)); return EDIT_FONTS.includes(s) ? s : EDIT_FONTS[1]; } catch { return EDIT_FONTS[1]; }
  });
  const efIdx = EDIT_FONTS.indexOf(editFont);
  const setEditFontPersist = (next: number) => {
    try { localStorage.setItem(EDIT_FONT_KEY, String(next)); } catch { /* ignore */ }
    setEditFont(next);
  };

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

  const tab = (mode: "write" | "split" | "preview", label: string, hint: string, icon: ReactNode) => (
    <button
      type="button"
      className={`blog-editor-tab${view === mode ? " is-active" : ""}`}
      aria-pressed={view === mode}
      onClick={() => setView(mode)}
    >
      {icon}
      <span>{label}</span>
      <span className="blog-editor-tab-hint" aria-hidden="true">{hint}</span>
    </button>
  );

  return (
    <div className="blog-editor">
      <div className="blog-editor-head" role="group" aria-label="Post title and lede">
        <div className="blog-editor-field">
          <input
            className="blog-editor-title"
            value={draft.title}
            placeholder="Untitled note"
            aria-label="Post title"
            onChange={(e) => onDraft({ ...draft, title: e.target.value })}
          />
        </div>
        <div className="blog-editor-field">
          <input
            className="blog-editor-desc"
            value={draft.description}
            placeholder="One line on what this note is about."
            aria-label="Post description"
            onChange={(e) => onDraft({ ...draft, description: e.target.value })}
          />
        </div>
      </div>

      <div className="blog-editor-meta" aria-label="Post metadata">
        {cell("DATE", (
          <div className="blog-editor-field blog-editor-date">
            {/* native date input — system picker glyph, locale format, no
                custom calendar or duplicated echo */}
            <input className="blog-editor-meta-input blog-editor-date-native" type="date" value={draft.date} aria-label="Date" onChange={(e) => onDraft({ ...draft, date: e.target.value })} />
          </div>
        ))}
        {cell("TAGS", (
          <div className="blog-editor-field blog-editor-tags">
            <input
              className="blog-editor-meta-input"
              value={tagInput}
              list="blog-tag-suggestions"
              placeholder={draft.tags.length ? "Add another…" : "type + Enter to add"}
              aria-label="Tags"
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault(); addTag(tagInput);
                } else if (e.key === "Backspace" && !tagInput && draft.tags.length) {
                  onDraft({ ...draft, tags: draft.tags.slice(0, -1) });
                }
              }}
              onBlur={commitTags}
            />
            {draft.tags.length > 0 && (
              <span className="blog-editor-tags-list" aria-label="Added tags">
                {draft.tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="blog-editor-tag"
                    aria-label={`Remove tag ${t}`}
                    onClick={() => onDraft({ ...draft, tags: draft.tags.filter((x) => x !== t) })}
                  ><span aria-hidden="true">#</span>{t}<span className="blog-editor-tag-x" aria-hidden="true">×</span></button>
                ))}
              </span>
            )}
          </div>
        ))}
        <datalist id="blog-tag-suggestions">
          {TAG_SUGGESTIONS.filter((t) => !draft.tags.includes(t)).map((t) => <option key={t} value={t} />)}
        </datalist>
      </div>

      <div className="blog-editor-tabs" role="group" aria-label="Editor mode">
        {tab("write", "WRITE", "markdown", <Edit3 size={12} />)}
        {tab("split", "SPLIT", "source + preview", <Edit3 size={12} />)}
        {tab("preview", "PREVIEW", "as published", <Eye size={12} />)}
        <span className="blog-editor-tabs-sep" aria-hidden="true" />
        <span className="blog-size-group" role="group" aria-label="Editor text size">
          <button
            type="button"
            className="blog-size-btn"
            onClick={() => efIdx > 0 && setEditFontPersist(EDIT_FONTS[efIdx - 1])}
            disabled={efIdx <= 0}
            title="Smaller editor text"
            aria-label="Decrease editor text size"
          >A−</button>
          <button
            type="button"
            className="blog-size-btn"
            onClick={() => efIdx < EDIT_FONTS.length - 1 && setEditFontPersist(EDIT_FONTS[efIdx + 1])}
            disabled={efIdx >= EDIT_FONTS.length - 1}
            title="Larger editor text"
            aria-label="Increase editor text size"
          >A+</button>
        </span>
      </div>

      {view === "split" ? (
        <MDEditor
          value={draft.body}
          onChange={(v) => onDraft({ ...draft, body: v ?? "" })}
          preview="live"
          style={{ "--md-editor-font-size": `${editFont}px` } as React.CSSProperties}
          textareaProps={{ placeholder: "# Start with a heading\n\nWrite in markdown, or use the toolbar above.", "aria-label": "Post body (markdown)" }}
          commands={EDITOR_COMMANDS}
          extraCommands={[]}
          height={560}
          visibleDragbar={false}
          data-color-mode={colorMode}
        />
      ) : view === "preview" ? (
        <div className="blog-editor-preview" data-color-mode={colorMode} aria-label="Article preview">
          <div className="blog-editor-preview-flag" aria-hidden="true"><Check size={12} /> DRAFT AS PUBLISHED</div>
          <div className="blog-prose blog-editor-preview-prose" role="article">
            <h1 className="blog-editor-preview-title">{draft.title || "Untitled note"}</h1>
            {draft.description && <p className="blog-article-desc">{draft.description}</p>}
            {draft.body.trim() ? (
              <MarkdownPreview source={draft.body} remarkPlugins={[remarkCallout]} />
            ) : (
              <p className="blog-editor-preview-empty">Nothing here yet. Switch to WRITE and start typing. The preview shows exactly how this note will read on the blog.</p>
            )}
          </div>
        </div>
      ) : (
        <MDEditor
          value={draft.body}
          onChange={(v) => onDraft({ ...draft, body: v ?? "" })}
          preview="edit"
          style={{ "--md-editor-font-size": `${editFont}px` } as React.CSSProperties}
          textareaProps={{ placeholder: "# Start with a heading\n\nWrite in markdown, or use the toolbar above.", "aria-label": "Post body (markdown)" }}
          commands={EDITOR_COMMANDS}
          extraCommands={[]}
          height={520}
          visibleDragbar={false}
          data-color-mode={colorMode}
        />
      )}

      <div className="blog-editor-foot">
        <span className="blog-editor-stats">{words} words · ~{readMin} min read</span>
        <span className="blog-save-state" data-state={saveState} role="status" aria-live="polite">
          {saveState === "saving" ? "Saving draft…" : saveState === "saved" ? "Draft saved locally" : saveState === "error" ? "Draft save failed" : "Draft is local"}
        </span>
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
