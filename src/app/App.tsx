import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadContent, saveContent, resetContent,
  type CmsContent,
} from "../cms";
import CmsEditor from "../CmsEditor";
import hazemPhoto from "../imports/hazem-photo.jpeg";
import cvPdf from "../imports/Hazem-Alabiad-CV.pdf";

/* ── reveal-on-scroll ─────────────────────────────────────────────────── */
function Reveal({ children, className = "", style = {} as React.CSSProperties }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("in"); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={style}>{children}</div>;
}

/* ── boot screen (from old design, kept) ──────────────────────────────── */
const BOOT_LINES = [
  "[ OK ] Initializing neural interface…",
  "[ OK ] Loading personality matrix v2.6.0",
  "[ OK ] Mounting knowledge base: NLP / LLMs / CompLing",
  "[ OK ] Indexing production experience…",
  "[ OK ] Connecting to Tübingen research node",
  "[ OK ] Verifying cryptographic identity",
  "[ OK ] All systems nominal. Launching portfolio…",
];

function BootScreen({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [wiping, setWiping] = useState(false);
  const launched = useRef(false);
  const launch = () => { if (launched.current) return; launched.current = true; setWiping(true); setTimeout(onDone, 600); };

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => { setLines((p) => [...p, BOOT_LINES[i]]); i++; if (i >= BOOT_LINES.length) clearInterval(iv); }, 200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (!e.repeat && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); launch(); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div onClick={launch} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", animation: wiping ? "boot-wipe 0.5s cubic-bezier(0.7,0,1,1) forwards" : "none", transformOrigin: "top" }}>
      <div style={{ fontFamily: "var(--font-mono)", textAlign: "center", padding: "0 28px" }}>
        <div style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.3em", marginBottom: 28 }}>HAZEM_ALABIAD // BOOT</div>
        <div style={{ textAlign: "left", display: "inline-block", minWidth: 280 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: i === lines.length - 1 ? "var(--ink)" : "var(--ink-faint)", letterSpacing: "0.06em", lineHeight: 1.8 }}>
              {line}{i === lines.length - 1 && <span style={{ display: "inline-block", width: 7, height: 13, background: "var(--amber)", marginLeft: 6, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, height: 2, background: "var(--rule)", borderRadius: 2, overflow: "hidden", maxWidth: 360, margin: "28px auto 0" }}>
          <div style={{ height: "100%", width: `${(lines.length / BOOT_LINES.length) * 100}%`, background: "var(--amber)", transition: "width 0.2s ease" }} />
        </div>
        <div style={{ marginTop: 24, fontSize: 10, letterSpacing: "0.25em", color: "var(--ink-faint)" }}>ENTER ↵ / SPACE / CLICK TO LAUNCH</div>
      </div>
    </div>
  );
}

const BOOTED_KEY = "hazem_portfolio_booted_v3";

/* ── terminal hero (job stuff + photo) ─────────────────────────────────── */
const TERM_ROLES = [
  { t: "Student Assistant · LLM AI-Tutor", p: true },
  { t: "Research Assistant · Cognitive & AI (IWM)", p: false },
  { t: "NLP Engineer", p: false },
  { t: "Full-Stack Engineer", p: false },
];

function TerminalHero({ content, factLocation }: { content: CmsContent; factLocation: string }) {
  const [typed, setTyped] = useState(false);
  const [cmd, setCmd] = useState("");
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    if (reduce) { setTyped(true); setCmd("./job --status"); return; }
    let i = 0;
    const text = "./job --status";
    const iv = setInterval(() => { setCmd(text.slice(0, i + 1)); i++; if (i >= text.length) { clearInterval(iv); setTimeout(() => setTyped(true), 250); } }, 45);
    return () => clearInterval(iv);
  }, [reduce]);

  const email = content.links.find((l) => l.label === "EMAIL")?.href || `mailto:${content.links.find((l) => l.label === "EMAIL")?.value || ""}`;

  return (
    <header className="hero" id="home">
      <div className="wrap">
        {/* macOS-style terminal */}
        <div className="term-window">
          <div className="term-titlebar">
            <span className="term-dot term-dot-red" />
            <span className="term-dot term-dot-yellow" />
            <span className="term-dot term-dot-green" />
            <span className="term-title">hazem@tübingen — zsh — 80×24</span>
          </div>
          <div className="term-body">
            <div className="term-line"><span className="term-ok">✓</span> hazem-alabiad.ini loaded — 4 roles, {factLocation}</div>
            <div className="term-line">
              <span className="term-arrow">➜</span> <span className="term-path">~/portfolio</span>{cmd}<span className="term-cursor" />
            </div>

            {typed && (
              <div className="term-output">
                <div className="term-roles">
                  {TERM_ROLES.map((r, i) => (
                    <div className="term-role" key={r.t}>
                      <span className="term-idx">{String(i + 1).padStart(2, "0")}</span>
                      <span className="term-role-name">{r.t}</span>
                      {r.p && <span className="term-priority">◀ PRIORITY</span>}
                    </div>
                  ))}
                </div>
                <div className="term-grid">
                  <div className="term-kv"><span className="term-k">role</span><span className="term-v">"Student Asst. · LLM AI‑Tutor"</span></div>
                  <div className="term-kv"><span className="term-k">location</span><span className="term-v">"{factLocation}"</span></div>
                  <div className="term-kv"><span className="term-k">languages</span><span className="term-v">[{content.languages.map((l) => `"${l.name.slice(0, 2).toUpperCase()}"`).join(",")}]</span></div>
                  <div className="term-kv"><span className="term-k">open_to</span><span className="term-v">["Working Student","NLP/AI/LLMs"]</span></div>
                  <div className="term-kv"><span className="term-k">interests</span><span className="term-v">["drawing","voiceover","travel"]</span></div>
                  <div className="term-kv"><span className="term-k">status</span><span className="term-v term-v-green">"Open to opportunities"</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* photo + gloss beside terminal */}
        <div className="hero-side">
          <div className="hero-photo">
            <img src={content.photo || (hazemPhoto as string)} alt="Hazem Alabiad" />
          </div>
          <div className="gloss gloss--inline">
            <div className="gloss-line1">
              <span className="gloss-word">Computational</span>
              <span className="gloss-word">Linguist</span>
              <span className="gloss-word">&amp;</span>
              <span className="gloss-word">Full-Stack</span>
              <span className="gloss-word">Engineer</span>
            </div>
            <div className="gloss-line2">
              <span className="gloss-word">ADJ-technical</span>
              <span className="gloss-word">N.AGT-research</span>
              <span className="gloss-word">CONJ</span>
              <span className="gloss-word">ADJ-technical</span>
              <span className="gloss-word">N.AGT-builds</span>
            </div>
            <div className="gloss-translation">"studies how language works, and builds the systems that run on it"</div>
          </div>
        </div>
      </div>

      {/* name + bio + ctas */}
      <div className="wrap">
        <h1 className="name">Hazem Alabiad</h1>
        <p className="bio">
          {get(content, "heroTagline", "Software engineer with 6+ years building production systems and clean interfaces. Currently researching LLM AI-tutors and cognitive & AI as part of an M.A. in Computational Linguistics — bridging engineering, NLP, and cognitive science.")}
        </p>
        <div className="cta-row">
          <a className="btn primary" href={email}>Get in touch</a>
          <a className="btn" href={content.links.find((l) => l.label === "GITHUB")?.href || "#"} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a className="btn" href={content.links.find((l) => l.label === "LINKEDIN")?.href || "#"} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a className="btn" href={content.links.find((l) => l.label === "SCHOLAR")?.href || "#"} target="_blank" rel="noopener noreferrer">Scholar</a>
          <a className="btn" href={(content.cvDataUrl || cvPdf) as string} download="Hazem-Alabiad-CV.pdf">Résumé</a>
        </div>
        <div className="stats">
          {content.stats.map((s, i) => (
            <div className="stat" key={i}>
              <div className="stat-num">{s.to > 0 ? `${s.to}${s.suffix}` : s.suffix}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}

/* ── keyboard shortcuts overlay ───────────────────────────────────────── */
const SECTIONS = ["home", "experience", "research", "skills", "education", "contact"];
const SECTION_LABELS: Record<string, string> = { home: "Terminal", experience: "Experience", research: "Research", skills: "Skills", education: "Education", contact: "Contact" };

function Shortcuts({ open, onClose, onJump }: { open: boolean; onClose: () => void; onJump: (id: string) => void }) {
  if (!open) return null;
  const keys: [string, string, string?][] = [
    ["?", "Toggle this help"],
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
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(15,15,20,0.88)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule)", borderRadius: 6, padding: "32px 36px", maxWidth: 480, width: "90%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>Keyboard shortcuts</h2>
          <button onClick={onClose} style={{ background: "none", border: "1px solid var(--rule)", borderRadius: 3, color: "var(--ink-dim)", fontFamily: "var(--font-mono)", fontSize: 11, padding: "4px 10px", cursor: "pointer" }}>Esc ✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {keys.map(([k, label]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--rule-soft)", paddingBottom: 10 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-dim)" }}>{label}</span>
              <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--amber)", border: "1px solid var(--rule)", borderRadius: 3, padding: "2px 8px", minWidth: 56, textAlign: "center" }}>{k}</kbd>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {SECTIONS.map((id, i) => (
            <button key={id} onClick={() => { onJump(id); onClose(); }} style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-dim)", background: "var(--bg-elevated)", border: "1px solid var(--rule-soft)", borderRadius: 3, padding: "5px 12px", cursor: "pointer" }}>
              {i + 1}. {SECTION_LABELS[id]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── CMS unlock + helpers (kept) ──────────────────────────────────────── */
function get(content: CmsContent, key: keyof CmsContent, fallback: string): string {
  const v = content[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}
function ep(key: keyof CmsContent, fallback: string, base: React.CSSProperties, onSave: (k: keyof CmsContent, v: string) => void, enabled: boolean): React.HTMLAttributes<HTMLSpanElement> & { style: React.CSSProperties } {
  const style: React.CSSProperties = { ...base, outline: enabled ? "1px dashed rgba(217,164,65,0.5)" : "none", borderRadius: 2, cursor: enabled ? "text" : "default" };
  return { style, contentEditable: enabled ? true : undefined, suppressContentEditableWarning: true, onBlur: enabled ? (e) => { const t = (e.target as HTMLElement).textContent || ""; if (t !== fallback) onSave(key, t); } : undefined };
}

function CMSButton({ onUnlock, enabled, onDisable, onOpenEditor }: {
  onUnlock: () => void; enabled: boolean; onDisable: () => void; onOpenEditor: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  async function verify() {
    if (!token.trim()) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("https://api.github.com/user", { headers: { Authorization: `token ${token.trim()}`, "User-Agent": "hazem-portfolio" } });
      const data = await res.json();
      if (data.login === "hazem-alabiad") { setOpen(false); onUnlock(); } else setErr("Token does not match owner.");
    } catch { setErr("Verification failed."); }
    finally { setBusy(false); }
    setTimeout(() => setToken(""), 4000);
  }
  if (enabled) {
    return (
      <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 60, display: "flex", gap: 8 }}>
        <button onClick={onOpenEditor} className="cms-unlock" style={{ position: "static" }}>EDIT CV</button>
        <button onClick={onDisable} className="cms-unlock" style={{ position: "static" }}>LOCK</button>
      </div>
    );
  }
  return (
    <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 60 }}>
      {!open && <button className="cms-unlock" onClick={() => setOpen(true)}>CMS</button>}
      {open && (
        <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule)", borderRadius: 4, padding: 14, width: 240 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.1em", marginBottom: 8 }}>UNLOCK CMS</div>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="GitHub PAT" type="password" style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--rule)", color: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 12, padding: "7px 9px", borderRadius: 3, outline: "none" }} />
          {err && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--red)", marginTop: 6 }}>{err}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button onClick={verify} disabled={busy} className="btn primary" style={{ flex: 1, padding: "7px 10px" }}>{busy ? "..." : "UNLOCK"}</button>
            <button onClick={() => setOpen(false)} className="btn" style={{ padding: "7px 10px" }}>CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [booted, setBooted] = useState<boolean>(() => { try { return localStorage.getItem(BOOTED_KEY) === "1"; } catch { return false; } });
  const [content, setContent] = useState<CmsContent>(() => loadContent());
  const [cmsEnabled, setCmsEnabled] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  function save(key: keyof CmsContent, value: string) { setContent((prev) => { const next = { ...prev, [key]: value }; saveContent(next); return next; }); }
  function saveAll(next: CmsContent) { setContent(next); saveContent(next); }

  const factLocation = get(content, "factLocation", "Tübingen, Germany");
  const email = content.links.find((l) => l.label === "EMAIL")?.href || `mailto:${content.links.find((l) => l.label === "EMAIL")?.value || ""}`;
  const cvUrl = (content.cvDataUrl || cvPdf) as string;

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === "Escape") { setShortcutsOpen(false); return; }
      if (shortcutsOpen) return;
      switch (e.key) {
        case "?": setShortcutsOpen(true); break;
        case "j": case "ArrowDown": { e.preventDefault(); const idx = SECTIONS.findIndex((s) => { const el = document.getElementById(s); return el && el.getBoundingClientRect().top > 100; }); scrollTo(SECTIONS[Math.max(0, idx)]); break; }
        case "k": case "ArrowUp": { e.preventDefault(); const idx = [...SECTIONS].reverse().findIndex((s) => { const el = document.getElementById(s); return el && el.getBoundingClientRect().top < -100; }); scrollTo(SECTIONS[SECTIONS.length - 1 - Math.max(0, idx)]); break; }
        case "g": scrollTo("home"); break;
        case "G": scrollTo("contact"); break;
        case "t": scrollTo("home"); break;
        case "c": window.location.href = email; break;
        case "r": { const a = document.createElement("a"); a.href = cvUrl; a.download = "Hazem-Alabiad-CV.pdf"; a.click(); break; }
        case "1": scrollTo("home"); break;
        case "2": scrollTo("experience"); break;
        case "3": scrollTo("research"); break;
        case "4": scrollTo("skills"); break;
        case "5": scrollTo("education"); break;
        case "6": scrollTo("contact"); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcutsOpen, email, cvUrl]);

  const stackTerms = content.skills.filter((s) => s.cat === "stack").flatMap((s) => s.label.split("/").map((t) => t.trim()).filter(Boolean));
  const aiTerms = content.skills.filter((s) => s.cat === "ai").flatMap((s) => s.label.split("/").map((t) => t.trim()).filter(Boolean));
  const devopsTerms = ["Docker", "Git", "Jest", "Cypress", "Puppeteer", "Figma", "MySQL", "Agile", "Linux", "CI/CD"];
  const statNum = (s: { to: number; suffix: string }) => (s.to > 0 ? `${s.to}${s.suffix}` : s.suffix);

  return (
    <>
      {!booted && <BootScreen onDone={() => { setBooted(true); try { localStorage.setItem(BOOTED_KEY, "1"); } catch { /* empty */ } }} />}

      <nav>
        <div className="wrap">
          <button className="nav-mark" onClick={() => scrollTo("home")}>H<span>.</span>ALABIAD</button>
          <div className="nav-links">
            <a href="#experience" onClick={() => scrollTo("experience")}>Experience</a>
            <a href="#research" onClick={() => scrollTo("research")}>Research</a>
            <a href="#skills" onClick={() => scrollTo("skills")}>Skills</a>
            <a href="#education" onClick={() => scrollTo("education")}>Education</a>
            <a href="#contact" onClick={() => scrollTo("contact")}>Contact</a>
            <button className="nav-shorts" onClick={() => setShortcutsOpen(true)} title="Keyboard shortcuts (?)">⌘K</button>
          </div>
        </div>
      </nav>

      <TerminalHero content={content} factLocation={factLocation} />

      {/* ── EXPERIENCE ──────────────────────────────────────────────────── */}
      <section id="experience">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-gloss"><b>n.</b> — a chronological record of applied work</div>
            <h2 className="section-title">Exper<em>ience</em></h2>
          </div>
          <div className="timeline">
            {content.experience.map((exp) => (
              <Reveal key={exp.id}>
                <div className="entry">
                  <div className="entry-meta">
                    <span className="entry-date">{exp.period}</span>
                    {exp.current && <span className="entry-current">current</span>}
                  </div>
                  <h3 className="entry-role">{exp.role}</h3>
                  <p className="entry-org"><b>{exp.company}</b>{exp.location ? ` · ${exp.location}` : ""}</p>
                  <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESEARCH & PROJECTS ─────────────────────────────────────────── */}
      <section id="research">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-gloss"><b>n.</b> — inquiry made public and reproducible</div>
            <h2 className="section-title">Research &amp; Pro<em>jects</em></h2>
          </div>
          <div className="cite-list">
            {content.projects.map((p) => (
              <Reveal key={p.id}>
                <div className="cite">
                  <div className="cite-year">{p.year}</div>
                  <div>
                    <h3 className="cite-title">{p.link ? <a href={p.link} target="_blank" rel="noopener noreferrer">{p.name}</a> : p.name}</h3>
                    <p className="cite-desc">{p.desc}</p>
                    <div className="cite-tags">{p.tags.map((t) => <span className="cite-tag" key={t}>{t}</span>)}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILLS ──────────────────────────────────────────────────────── */}
      <section id="skills">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-gloss"><b>n.</b> — the working vocabulary, grouped by class</div>
            <h2 className="section-title">Lexi<em>con</em></h2>
          </div>
          <div className="lexicon">
            <Reveal><div className="lex-row"><div className="lex-class">Full-Stack</div><div className="lex-terms">{stackTerms.map((t) => <span className="term" key={t}>{t}</span>)}</div></div></Reveal>
            <Reveal><div className="lex-row"><div className="lex-class">AI / NLP</div><div className="lex-terms">{aiTerms.map((t) => <span className="term" key={t}>{t}</span>)}</div></div></Reveal>
            <Reveal><div className="lex-row"><div className="lex-class">DevOps &amp; Workflow</div><div className="lex-terms">{devopsTerms.map((t) => <span className="term" key={t}>{t}</span>)}</div></div></Reveal>
          </div>
        </div>
      </section>

      {/* ── EDUCATION ───────────────────────────────────────────────────── */}
      <section id="education">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-gloss"><b>n.</b> — formal training, in reverse</div>
            <h2 className="section-title">Educ<em>ation</em></h2>
          </div>
          <div className="edu-grid">
            {content.education.map((edu) => (
              <Reveal key={edu.id}>
                <div className="edu-item">
                  <div className="edu-date">{edu.period}</div>
                  <div>
                    <h3 className="edu-degree">{edu.degree}</h3>
                    <p className="edu-school">{edu.school}{edu.location ? ` · ${edu.location}` : ""}</p>
                    {edu.detail && <ul><li>{edu.detail}</li></ul>}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="lang-grid reveal">
            {content.languages.map((l) => (<div className="lang" key={l.id}><b>{l.name}</b> <span>— {l.level.toLowerCase()}</span></div>))}
          </div>
        </div>
      </section>

      {/* ── FOOTER / CONTACT ────────────────────────────────────────────── */}
      <footer id="contact">
        <div className="wrap">
          <div className="footer-top">
            <div className="footer-cta">
              <h2>Let's talk.</h2>
              <p>{get(content, "contactIntro", "Open to roles in NLP, AI/LLM engineering, and full-stack software engineering — reach out directly or find me on any of the links below.")}</p>
              <a className="btn primary" href={email}>Get in touch</a>
            </div>
            <div className="footer-links">
              <a href={email}>{content.links.find((l) => l.label === "EMAIL")?.value || ""}</a>
              <a href={content.links.find((l) => l.label === "GITHUB")?.href || "#"} target="_blank" rel="noopener noreferrer">github.com/hazem-alabiad</a>
              <a href={content.links.find((l) => l.label === "LINKEDIN")?.href || "#"} target="_blank" rel="noopener noreferrer">linkedin.com/in/hazemalabiad</a>
              <a href={content.links.find((l) => l.label === "SCHOLAR")?.href || "#"} target="_blank" rel="noopener noreferrer">scholar.google.com</a>
            </div>
          </div>
          <div className="interests reveal">
            <b>Outside of work:</b> drawing, voiceover, travelling, hiking, biking, sports, and reading about history, finance, and socioeconomics.
          </div>
          <div {...ep("footerLine", "", {}, save, cmsEnabled)} className="copyright">
            {get(content, "footerLine", "© 2026 Hazem Alabiad — built with care, tokenized by hand.")}
          </div>
        </div>
      </footer>

      <Shortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} onJump={scrollTo} />
      <CMSButton enabled={cmsEnabled} onUnlock={() => setCmsEnabled(true)} onDisable={() => setCmsEnabled(false)} onOpenEditor={() => setEditorOpen(true)} />
      {cmsEnabled && editorOpen && (
        <CmsEditor initial={content} onSave={(c) => { saveAll(c); setEditorOpen(false); }} onReset={() => { resetContent(); setContent(loadContent()); setEditorOpen(false); }} onClose={() => setEditorOpen(false)} />
      )}
    </>
  );
}
