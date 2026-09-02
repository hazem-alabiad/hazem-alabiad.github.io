# Blog Read + Editor Redesign — "Quiet Lab Notebook"

**Date:** 2026-09-02
**Status:** Design approved (brainstorming), pending spec review
**Scope:** Blog surfaces only — post read page, post index, and the add/edit pages (`/blog/admin/new`, `/blog/admin/edit/:slug`). **The landing page is explicitly out of scope.**

## Goal

Redesign the blog's read + edit experience around a **Quiet Lab Notebook** direction: the structural clarity of DigitalOcean docs and dev.to's developer-publishing readability, expressed in the site's own identity — dotted-grid backdrop, IBM Plex Mono accents, `$` terminal signatures, amber-accented, dark-first with a refined light mode.

Direction chosen against alternatives: (B) dev.to-caliber journal was offered; **C (Quiet Lab Notebook)** selected. Calm, structured, code-first, not decorative.

## Identity elements — kept (user-selected)

- `$` terminal signatures (`$ end of note`, blinking cursor, boot-adjacent voice)
- IBM Plex Mono accents (labels, numbers, meta, code)
- Dotted-grid backdrop
- Amber accent + dark umber base (dark default)

## Palette / tokens

| Token role | Dark (default) | Light (refined) |
|---|---|---|
| Background | umber `--bg`, dotted grid | warm paper `#FAF8F4`, softer dots |
| Ink ladder | ink / ink-dim / ink-faint | warm near-black ladder (`#2A2622` family), contrast ≥ 4.5:1 |
| Accent | current amber (`#D9A441` family) | deepened `#8A5A00` family for text; amber kept for hairlines/decoration |
| Panels (code, callouts) | elevated panel bg + hairline rules | light panel `#F1EDE5`-ish, dark ink code |
| Type | display + prose: Newsreader; labels/numbers/meta/code: IBM Plex Mono | same faces |

Housekeeping: `color-scheme` set per active theme; native date input and `<select>` explicitly themed (incl. light mode, per the Windows-dark-mode rule); `scroll-margin-top` kept on heading anchors.

## Read page: post article

- **Article sheet:** transparent, borderless, `max-width ≈ 760px` centered on the dotted grid; serif prose at 72–78ch measure; 16/18/20 font-size control kept (A−/A+).
- **Header block (DigitalOcean-style):** hairline masthead — tags left (mono `#tag` chips), reading tools right (owner: edit/delete; copy link; A−/A+). Below: serif `h1` (~44–56px), one-line byline `@author · date · min read · views`, muted lede line from the post description.
- **Structure:** sticky numbered ON THIS PAGE sidebar (right, scroll-spy) + numbered h2/h3 margin marginalia in the left gutter (CSS counters, exact sync — unchanged mechanics, restyled). Mobile: `<details>` TOC, marginalia hidden, zero horizontal overflow at 505px.
- **Code blocks — DigitalOcean treatment:** header bar above every `pre` — filename/lang chip left, COPY button right (hover-reveal desktop, always visible on touch); mono at a comfortable fixed size on solid `--bg-elevated`; no GitHub-dark flash. Existing copy/lang injection restyled. `prefers-reduced-motion` respected.
- **Callouts (new):** GFM-style marker `> [!NOTE]` / `> [!WARNING]` / `> [!TIP]` transformed by a small remark plugin into a hairline-boxed block with a mono eyebrow (`$ note` / `$ warning` / `$ tip`). The same plugin runs at MDX compile time (vite) **and** in the editor's `MarkdownPreview` (rehypePlugins), so published posts and editor preview render identically — no React component, no imports in post files.
- **`$ end of note`** marker kept (prompt + text + cursor).
- **Author signature block** + **prev/next hairline rows** kept from current design.
- **Comments:** labeled COMMENTS section, giscus untouched.

## Read page: post index

- Cards → **dev.to-style rows:** `date · title · tag chips` per row, amber hover.
- Search toolbar unchanged in behavior: `➜` prompt, `/` focus shortcut, Esc, hit-count, arrow-key navigation.
- Owner corner (NEW POST) kept.

## Editor (add/edit)

- Same route structure and workflow as today (`/blog/admin/new`, `/blog/admin/edit/:slug`); typed-sheet structure kept (back link, kicker `EDITING · slug` / `NEW POST`, serif `h1`, Newsreader title input, italic lede, DATE/TAGS meta strip, WRITE/PREVIEW tabs, A−/A+).
- **Sheet alignment:** writing area becomes the same 760px sheet as the read page — hero title sits on the sheet, body editor fills the sheet, so adding/editing reads like writing the published note.
- **Toolbar:** existing markdown commands kept; add a **callout** button inserting a `> [!NOTE]`-style block that renders identically on the read page and in preview.
- **Focus states:** keep the approved signals — amber caret-underline (title/lede), soft amber halo (DATE/TAGS) — retuned to the token values. Native date input + tag chips unchanged in mechanism.

## Hard constraints (behavior — must survive)

- Deep-link restore is boot-aware (`scrollToSection` waits for `[data-boot-screen]` to leave).
- Heading anchors pin via `history.replaceState`; heading click/keyboard (Enter/Space) and TOC clicks work; section scroll lands under the fixed nav.
- TOC scroll-spy, A−/A+ (16/18/20, persisted), code copy, `$` end marker.
- Search: `➜` prompt, `/` focus, Esc, hit-count, arrow navigation.
- Views count, hidden-slug deletion flow, owner edit/delete.
- Responsive: 505px no horizontal overflow; marginalia hidden on mobile.
- `prefers-reduced-motion`, visible keyboard focus, ≥44px touch targets.

## Implementation scope (files)

- `src/blog/Blog.tsx` — read/index JSX restructure (header block, code header-bar wiring, index rows, Callout render).
- `src/styles/theme.css` — rewrite of the blog section of the stylesheet + token additions + refined light mode. Landing page styles untouched.
- `src/blog/editor-panel.tsx`, `src/blog/editor.tsx` — sheet layout, callout command, light-mode md-editor theming.
- New remark callout plugin (shared: build + editor preview), plus its CSS.
- `index.css` / tokens as needed.
- Tests: update existing Blog + editor suites; add callout render + light-mode smoke coverage.
- Visual verification: Puppeteer at desktop + 505px (read + editor + light mode, zero overflow, marginalia/TOC numbers sync).
- Shipping: repo standard workflow (branch → PR → all checks incl. coverage gate → merge → deploy confirm). No changes to the landing page, publishing flow, giscus, or deep-link logic.

## Out of scope

Landing/home page, CV CMS (CmsEditor), post publishing pipeline (privacy/PR-routing ideas from the earlier brainstorm are separate), comment backend, search behavior beyond styling.