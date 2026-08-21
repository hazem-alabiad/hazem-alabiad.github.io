import { useState, useRef, useEffect } from "react";
import { posts } from "../../blog/posts";

const SECTIONS = ["home", "education", "experience", "research", "skills", "contact"];
const SECTION_LABELS: Record<string, string> = { home: "Terminal", experience: "Experience", research: "Research", skills: "Skills", education: "Education", contact: "Contact" };

export function Shortcuts({ open, onClose, onJump, onOpenPost, search = true }: { open: boolean; onClose: () => void; onJump: (id: string) => void; onOpenPost?: (slug: string) => void; search?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(-1);
  
  useEffect(() => { 
    if (open) { 
      setQ(""); 
      setActive(-1); 
      const t = setTimeout(() => inputRef.current?.focus(), 60); 
      return () => clearTimeout(t); 
    } 
  }, [open]);
  
  if (!open) return null;
  
  const keys: [string, string, string?][] = [
    ["⌘K / ?", "Toggle this search + shortcuts"],
    ["j / ↓", "Next section"],
    ["k / ↑", "Previous section"],
    ["g", "Go to terminal (top)"],
    ["G", "Go to contact (bottom)"],
    ["t", "Focus terminal"],
    ["c", "Compose email"],
    ["r", "Download résumé"],
    ["1–6", "Jump to section by number"],
    ["Esc", "Close this overlay"],
  ];
  
  const query = q.trim().toLowerCase();
  const sectionMatches = SECTIONS.filter((id) => !query || SECTION_LABELS[id].toLowerCase().includes(query));
  const postMatches = query && onOpenPost
    ? posts
        .map((p) => ({ p, s: (p.title.toLowerCase().includes(query) ? 3 : 0) + (p.tags.some((t) => t.toLowerCase().includes(query)) ? 2 : 0) + (p.description.toLowerCase().includes(query) ? 1 : 0) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .map((x) => x.p)
        .slice(0, 6)
    : [];
  const total = sectionMatches.length + postMatches.length;
  const results: { id: string; label: string; sub: string; go: () => void }[] = [
    ...sectionMatches.map((id) => ({ id, label: SECTION_LABELS[id], sub: "section", go: () => { onJump(id); onClose(); } })),
    ...postMatches.map((p) => ({ id: p.slug, label: p.title, sub: "blog post", go: () => { onOpenPost?.(p.slug); onClose(); } })),
  ];
  const clamped = active < 0 ? -1 : Math.min(active, total - 1);
  
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (total ? (a + 1) % total : -1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (total ? (a - 1 + total) % total : -1)); }
    else if (e.key === "Enter" && clamped >= 0 && results[clamped]) { results[clamped].go(); }
    else if (e.key === "Enter" && sectionMatches.length === 1 && !postMatches.length) { onJump(sectionMatches[0]); onClose(); }
  };
  
  return (
    <div className="sc-overlay-dimmer" onClick={onClose}>
      <div className="sc-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0 }}>Quick search</h2>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--rule)", borderRadius: 4, color: "var(--ink-dim)", fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>Esc ✕</button>
        </div>
        {search && (
          <input
            ref={inputRef}
            className="sc-search"
            placeholder="Search sections or blog posts…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(-1); }}
            onKeyDown={onKey}
          />
        )}
        {query && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            {total === 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>No results for “{q}”.</span>
            )}
            {results.map((r, i) => (
              <button
                key={r.id}
                onClick={() => { setActive(i); r.go(); }}
                onMouseEnter={() => setActive(i)}
                style={{ textAlign: "left", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink)", background: i === clamped ? "var(--bg-elevated)" : "transparent", border: i === clamped ? "1px solid var(--amber-soft)" : "1px solid transparent", borderRadius: 8, padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>{r.sub}</span>
              </button>
            ))}
          </div>
        )}
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          {keys.map(([k, label]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--rule-soft)", paddingBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-dim)" }}>{label}</span>
              <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)", border: "1px solid var(--rule)", borderRadius: 4, padding: "2px 8px", minWidth: 56, textAlign: "center" }}>{k}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
