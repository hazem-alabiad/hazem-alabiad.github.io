import { useEffect, useMemo, useRef, useState } from "react";
import {
  loadContent, saveContent, resetContent,
  type CmsContent,
} from "../cms";
import CmsEditor from "../CmsEditor";
import { BlogIndex, BlogPost } from "../blog/Blog";
import BlogAdmin from "../blog/BlogAdmin";
import hazemPhoto from "../imports/hazem-photo.jpeg";
import cvPdf from "../imports/Hazem-Alabiad-CV.pdf";

const CMS_TOKEN_KEY = "hazem-cms-token";

/* ── tiny hash router for the blog ────────────────────────────────────── */
function useBlogRoute() {
  const [route, setRoute] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  if (route === "#/blog/admin" || route === "#/blog/admin/") return { view: "admin" } as const;
  if (route.startsWith("#/blog/")) return { view: "post", slug: route.slice("#/blog/".length) } as const;
  if (route === "#/blog" || route === "#/blog/") return { view: "blog" } as const;
  return { view: "home" } as const;
}

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

/* ── line icons (inline SVG, currentColor) ───────────────────────────── */
const ICONS: Record<string, string> = {
  grad: "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0zM22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5",
  work: "M12 12h.01M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m14 7a18.15 18.15 0 0 1-20 0M2 20h20M2 6h20v14H2zM2 13a18.15 18.15 0 0 1 20 0",
  flask: "M14 2v6a2 2 0 0 0 .245.96l5.51 10.08A2 2 0 0 1 18 22H6a2 2 0 0 1-1.755-2.96l5.51-10.08A2 2 0 0 0 10 8V2M6.453 15h11.094M8.5 2h7",
  code: "m16 18 6-6-6-6M8 6 2 12l6 6",
  wrench: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm18 2L12 13 2 6",
  ext: "M7 17 17 7M7 7h10v10",
  gh: "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85V21c0 .27.18.58.69.48A10 10 0 0 0 12 2z",
  in: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z",
  scholar: "M12 3 1 9l11 6 9-4.91V17h2V9zM5 13.18V17c0 1.66 3.13 3 7 3s7-1.34 7-3v-3.82l-7 3.82z",
  cv: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  pen: "M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z",
  mic: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  mountain: "M8 3 1 21h22L16 9l-4 6-2-3L8 3z",
  bike: "M5.5 18a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM18.5 18a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM14 9 13 6h3l1 3h3M8 12h4l3-3",
  ball: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a12 12 0 0 0-4 10 12 12 0 0 0 4 10 12 12 0 0 0 4-10 12 12 0 0 0-4-10z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z",
  chart: "M3 3v18h18M18 17V9M13 17V5M8 17v-3",
  scales: "M12 3v18M8 21h8M6 7h12M6 7 3 14h6zM18 7l-3 7h6z",
};
function Icon({ name, size = 14, className = "" }: { name: string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] || ""} />
    </svg>
  );
}

/* ── organization mark (LinkedIn-style logo tile, shield fallback) ──── */
/* ── university crest (LinkedIn-style school mark) ────────────────────── */
function UniCrest({ school, size = 44 }: { school: string; size?: number }) {
  const s = school.toLowerCase().includes("tübingen")
    ? { bg: "#7CC4A8", fg: "#131015", glyph: "T" }
    : { bg: "#0E4C92", fg: "#F2EEE6", glyph: school.charAt(0) };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="edu-crest">
      <rect x="1" y="1" width="46" height="46" rx="12" fill={s.bg} />
      <rect x="1" y="1" width="46" height="46" rx="12" fill="none" stroke="var(--rule-soft)" />
      <path d="M24 11l11 5v7h-.4c0 4.9-4 8.6-10.6 8.6S13.4 27.9 13.4 23H13v-7l11-5z" fill="none" stroke={s.fg} strokeWidth="2" strokeLinejoin="round" />
      <path d="M16.5 30.5L20 21h8l3.5 9.5" fill="none" stroke={s.fg} strokeWidth="2" strokeLinejoin="round" />
      <text x="24" y="38" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="600" fontSize="14" fill={s.fg}>{s.glyph}</text>
    </svg>
  );
}

/* ── scroll progress bar (top) ───────────────────────────────────────── */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return <div className="progress-track" aria-hidden="true"><div className="progress-bar" style={{ transform: `scaleX(${p})` }} /></div>;
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
  { t: "NLP / AI / LLM Research", p: true, tag: "focus" },
  { t: "Full-Stack Engineering", p: true, tag: "focus" },
  { t: "Student Assistant · LLM AI-Tutor", p: false, tag: "current" },
  { t: "Research Assistant · Cognitive & AI (IWM)", p: false, tag: "current" },
];

function TerminalHero({ content, factLocation, visits }: { content: CmsContent; factLocation: string; visits: number }) {
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
      <div className="hero-glow" aria-hidden="true" />
      <div className="wrap">
        {/* identity: photo + name + status */}
        <div className="hero-top">
          <div className="hero-photo">
            <img src={content.photo || (hazemPhoto as string)} alt="Hazem Alabiad" />
          </div>
          <div className="hero-id">
            <p className="hero-eyebrow">— cv.status —</p>
            <div className="hero-name-row">
              <h1 className="name"><span className="name-first">Hazem</span><span className="name-dot">.</span><span className="name-last">Alabiad</span></h1>
              <span className="status-pill" title="Open to roles in NLP/AI/LLM and full-stack">
                <span className="status-pill-dot" /> open to opportunities
              </span>
            </div>
            <div className="gloss gloss--inline">
              <div className="gloss-line1">
                <span className="gloss-word">Computational</span>
                <span className="gloss-word">Linguist</span>
                <span className="gloss-word">&amp;</span>
                <span className="gloss-word">Full-Stack</span>
                <span className="gloss-word">Engineer</span>
              </div>
            </div>
            <p className="bio" dangerouslySetInnerHTML={{ __html: get(content, "heroTagline", "<strong>Computational Linguist &amp; Full-Stack Engineer.</strong> Shipped to <strong>3M+ people</strong> — IBM Data Quality (1M+ enterprise users), GetirJobs (2.2M+), 3× faster builds. Now on an <strong>M.A. in Computational Linguistics</strong> at Tübingen, building an LLM-based AI tutor. <strong>Open to NLP/AI and full-stack roles.</strong>") }} />
            <div className="cta-row">
              <a className="btn primary" href={email}><Icon name="mail" size={14} /> Get in touch</a>
              <a className="btn ic-gh" href={content.links.find((l) => l.label === "GITHUB")?.href || "#"} target="_blank" rel="noopener noreferrer"><Icon name="gh" size={14} /> GitHub</a>
              <a className="btn ic-in" href={content.links.find((l) => l.label === "LINKEDIN")?.href || "#"} target="_blank" rel="noopener noreferrer"><Icon name="in" size={14} /> LinkedIn</a>
              <a className="btn ic-go" href={content.links.find((l) => l.label === "SCHOLAR")?.href || "#"} target="_blank" rel="noopener noreferrer"><Icon name="scholar" size={14} /> Scholar</a>
              <a className="btn btn-cv" href={(content.cvDataUrl || cvPdf) as string} download="Hazem-Alabiad-CV.pdf"><Icon name="cv" size={14} /> <strong>CV</strong></a>
            </div>
          </div>
        </div>

        {/* signature flourish: terminal */}
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
                    <div className={`term-role ${r.p ? "term-role--prio" : ""}`} key={r.t}>
                      <span className="term-idx">{String(i + 1).padStart(2, "0")}</span>
                      <span className="term-role-name">{r.t}</span>
                      {r.tag === "focus" && <span className="term-tag term-tag--focus">◆ FOCUS</span>}
                      {r.tag === "current" && <span className="term-tag">● current</span>}
                      {r.p && <span className="term-priority">◀ PRIORITY</span>}
                    </div>
                  ))}
                </div>
                <div className="term-grid">
                  {content.education.filter((e) => e.current).map((e) => (
                    <div className="term-current" key={e.id}>
                      <span className="term-current-ic"><Icon name="grad" size={16} /></span>
                      <span className="term-current-v">
                        <strong>{e.degree}</strong>
                        <span className="term-current-school">{e.school} · <em>{e.location}</em></span>
                        <span className="term-current-period">{e.period}</span>
                      </span>
                      <span className="term-tag term-tag--now">● current</span>
                    </div>
                  ))}
                  <div className="term-kv term-kv--feature"><span className="term-k">experience</span><span className="term-v">"6+ years"</span></div>
                  <div className="term-kv term-kv--feature"><span className="term-k">open_to</span><span className="term-v">["Working Student", "NLP/AI/LLMs"]</span></div>
                  <div className="term-kv"><span className="term-k">languages</span><span className="term-v">[{content.languages.map((l) => `"${l.name.slice(0, 2).toUpperCase()}"`).join(", ")}]</span></div>
                  <div className="term-kv term-kv--feature"><span className="term-k">visitors</span><span className="term-v">{visits.toLocaleString()}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
        <a className="hero-scroll" href="#experience" onClick={(e) => { e.preventDefault(); scrollTo("experience"); }}>
          <span className="hero-scroll-line" /> scroll for the transcript — terminal &amp; roles below
        </a>
      </div>
    </header>
  );
}

/* ── contact form (opens mailto on send) ─────────────────────────────── */
function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);

  function send() {
    const body = `Name: ${name}\nFrom: ${from}\n\n${msg}`;
    const mailto = `${email}?subject=${encodeURIComponent(subject || "Hello Hazem")}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="contact-form">
      <div className="contact-row">
        <input className="contact-input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="contact-input" placeholder="Your email" type="email" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <input className="contact-input" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <textarea className="contact-input contact-textarea" placeholder="Your message…" value={msg} onChange={(e) => setMsg(e.target.value)} rows={4} />
      <button className="btn primary contact-send" onClick={send}>
        {sent ? "✓ Opening your email client…" : "Send message →"}
      </button>
    </div>
  );
}

/* ── toast (copied/notification) ──────────────────────────────────────── */
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2600); return () => clearTimeout(t); }, [onClose]);
  return <div className="toast">{message}</div>;
}

/* ── keyboard shortcuts overlay ───────────────────────────────────────── */
const SECTIONS = ["home", "education", "experience", "research", "skills", "contact"];
const SECTION_LABELS: Record<string, string> = { home: "Terminal", experience: "Experience", research: "Research", skills: "Skills", education: "Education", contact: "Contact" };

function Shortcuts({ open, onClose, onJump, search = true }: { open: boolean; onClose: () => void; onJump: (id: string) => void; search?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  useEffect(() => { if (open) { setQ(""); const t = setTimeout(() => inputRef.current?.focus(), 60); return () => clearTimeout(t); } }, [open]);
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
  const go = (id: string) => { onJump(id); onClose(); setQ(""); };
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
            placeholder="Search sections… press Enter to jump"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && sectionMatches.length === 1) go(sectionMatches[0]); }}
          />
        )}
        {query && (
          <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {sectionMatches.length === 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-faint)" }}>No sections match “{q}”.</span>
            )}
            {sectionMatches.map((id, i) => (
              <button key={id} onClick={() => go(id)} style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)", background: "var(--bg-elevated)", border: "1px solid var(--amber-soft)", borderRadius: 6, padding: "7px 14px", cursor: "pointer" }}>
                {SECTIONS.indexOf(id) + 1}. {SECTION_LABELS[id]}
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

  async function verify(value: string) {
    if (!value.trim()) return;
    setBusy(true); setErr("");
    try {
      const res = await fetch("https://api.github.com/user", { headers: { Authorization: `token ${value.trim()}`, "User-Agent": "hazem-portfolio" } });
      const data = await res.json();
      if (data.login === "hazem-alabiad") {
        try { localStorage.setItem(CMS_TOKEN_KEY, value.trim()); } catch { /* storage unavailable */ }
        setOpen(false); onUnlock();
      } else setErr("Token does not match owner.");
    } catch { setErr("Verification failed."); }
    finally { setBusy(false); }
    setTimeout(() => setToken(""), 4000);
  }

  useEffect(() => {
    let saved = "";
    try { saved = localStorage.getItem(CMS_TOKEN_KEY) || ""; } catch { /* noop */ }
    if (saved) verify(saved).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function lock() {
    try { localStorage.removeItem(CMS_TOKEN_KEY); } catch { /* noop */ }
    onDisable();
  }

  if (enabled) {
    return (
      <div style={{ position: "fixed", right: 18, bottom: 18, zIndex: 60, display: "flex", gap: 8 }}>
        <button onClick={onOpenEditor} className="cms-unlock" style={{ position: "static" }}>EDIT CV</button>
        <button onClick={lock} className="cms-unlock" style={{ position: "static" }}>LOCK</button>
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
            <button onClick={() => verify(token)} disabled={busy} className="btn primary" style={{ flex: 1, padding: "7px 10px" }}>{busy ? "..." : "UNLOCK"}</button>
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
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => { try { return localStorage.getItem("hazem_theme") === "light" ? "light" : "dark"; } catch { return "dark"; } });
  const [visits, setVisits] = useState(0);
  const blogRoute = useBlogRoute();
  const goBlog = (slug?: string) => { window.location.hash = slug ? `#/blog/${slug}` : "#/blog"; window.scrollTo({ top: 0 }); };
  const exitBlog = () => { window.location.hash = "#/blog"; window.scrollTo({ top: 0 }); };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("hazem_theme", theme); } catch { /* empty */ }
  }, [theme]);

  useEffect(() => {
    try {
      const host = window.location.hostname;
      const isDev = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
      const ownerSkipped = localStorage.getItem("hazem_owner") === "1";
      const sessionCounted = sessionStorage.getItem("hazem_visits_session") === "1";
      if (isDev || ownerSkipped) { setVisits(parseInt(localStorage.getItem("hazem_visits") || "0", 10)); return; }
      if (!sessionCounted) {
        const c = parseInt(localStorage.getItem("hazem_visits") || "0", 10);
        const n = c + 1;
        localStorage.setItem("hazem_visits", String(n));
        sessionStorage.setItem("hazem_visits_session", "1");
        setVisits(n);
      } else {
        setVisits(parseInt(localStorage.getItem("hazem_visits") || "0", 10));
      }
    } catch { setVisits(1); }
  }, []);

  function save(key: keyof CmsContent, value: string) { setContent((prev) => { const next = { ...prev, [key]: value }; saveContent(next); return next; }); }
  function saveAll(next: CmsContent) { setContent(next); saveContent(next); }

  const factLocation = get(content, "factLocation", "Tübingen, Germany");
  const email = content.links.find((l) => l.label === "EMAIL")?.href || `mailto:${content.links.find((l) => l.label === "EMAIL")?.value || ""}`;
  const cvUrl = (content.cvDataUrl || cvPdf) as string;

  const scrollTo = (id: string) => {
    if (blogRoute.view !== "home") {
      window.location.hash = "";
      const doScroll = () => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth" });
        if (el) window.scrollTo({ top: el.offsetTop - 0 });
      };
      setTimeout(doScroll, 80);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); setShortcutsOpen(true); return; }
      if (e.key === "Escape") { setShortcutsOpen(false); return; }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
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
        case "2": scrollTo("education"); break;
        case "3": scrollTo("experience"); break;
        case "4": scrollTo("research"); break;
        case "5": scrollTo("skills"); break;
        case "6": scrollTo("contact"); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcutsOpen, email, cvUrl]);

  const devopsTerms = ["Docker", "Git", "Jest", "Cypress", "Puppeteer", "Figma", "MySQL", "Agile", "Linux", "CI/CD"];

  return (
    <>
      <ScrollProgress />
      {!booted && <BootScreen onDone={() => { setBooted(true); try { localStorage.setItem(BOOTED_KEY, "1"); } catch { /* empty */ } }} />}

      <nav>
        <div className="wrap">
          <button className="nav-mark" onClick={() => scrollTo("home")}>H<span>.</span>ALABIAD</button>
          <div className="nav-links">
            <a href="#education" onClick={() => scrollTo("education")}>Education</a>
            <a href="#experience" onClick={() => scrollTo("experience")}>Experience</a>
            <a href="#research" onClick={() => scrollTo("research")}>Research</a>
            <a href="#skills" onClick={() => scrollTo("skills")}>Skills</a>
            <a href="#blog" onClick={(e) => { e.preventDefault(); goBlog(); }} className="nav-blog">Blog</a>
            <a href="#contact" onClick={() => scrollTo("contact")}>Contact</a>
            <button className="nav-shorts" onClick={() => setShortcutsOpen(true)} title="Search & shortcuts (⌘K)">⌘K</button>
            <button
              className="nav-theme"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button className="nav-hire" onClick={() => { navigator.clipboard?.writeText(email.replace("mailto:", "")); setToast("Email copied — hazem.alabiad@icloud.com"); }}>Hire me</button>
          </div>
        </div>
      </nav>

      {blogRoute.view === "home" && (
        <>
          <TerminalHero content={content} factLocation={factLocation} visits={visits} />

      {/* ── EDUCATION ───────────────────────────────────────────────────── */}
      <section id="education">
        <div className="wrap">
          <Reveal className="section-head">
            <div className="section-title-row">
              <span className="section-icon-badge section-icon-badge--violet"><Icon name="grad" size={20} /></span>
              <h2 className="section-title">Educ<em>ation</em></h2>
            </div>
          </Reveal>
          <div className="timeline">
            {content.education.map((edu) => (
              <Reveal key={edu.id}>
                <div className="entry entry--edu">
                  <div className="entry-dot" aria-hidden="true" />
                  <div className="entry-body">
                    <div className="entry-meta">
                      <span className="entry-current-row">{edu.current && <span className="entry-current">current</span>}</span>
                      <span className="entry-org-name">{edu.school}</span>
                      <span className="entry-loc">{edu.location}</span>
                      <span className="entry-date">{edu.period}</span>
                    </div>
                    <h3 className="entry-role">{edu.degree}</h3>
                    {edu.detail && <ul>{edu.detail.split(". ").filter(Boolean).map((d, j) => <li key={j}>{d}.</li>)}</ul>}
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

      {/* ── EXPERIENCE ──────────────────────────────────────────────────── */}
      <section id="experience">
        <div className="wrap">
          <Reveal className="section-head">
            <div className="section-title-row">
              <span className="section-icon-badge section-icon-badge--sage"><Icon name="work" size={20} /></span>
              <h2 className="section-title">Exper<em>ience</em></h2>
            </div>
          </Reveal>
          <div className="timeline">
            {content.experience.map((exp) => (
              <Reveal key={exp.id}>
                <div className="entry">
                  <div className="entry-dot" aria-hidden="true" />
                  <div className="entry-body">
                    <div className="entry-meta">
                      <span className="entry-current-row">{exp.current && <span className="entry-current">current</span>}</span>
                      <span className="entry-org-name">{exp.company}</span>
                      <span className="entry-loc">{exp.location}</span>
                      <span className="entry-date">{exp.period}</span>
                    </div>
                    <h3 className="entry-role">{exp.role}</h3>
                    <ul>{exp.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>
                    {exp.tags?.length > 0 && (
                      <div className="entry-tags">{exp.tags.map((t) => <span className="entry-tag" key={t}>{t}</span>)}</div>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESEARCH & PROJECTS ─────────────────────────────────────────── */}
      <section id="research">
        <div className="wrap">
          <Reveal className="section-head">
            <div className="section-title-row">
              <span className="section-icon-badge section-icon-badge--pink"><Icon name="flask" size={20} /></span>
              <h2 className="section-title">Research &amp; Pro<em>jects</em></h2>
            </div>
          </Reveal>
          <div className="proj-grid">
            {content.projects.map((p) => (
              <Reveal key={p.id}>
                <article className={`proj-card ${p.status === "RESEARCH" ? "proj-card--research" : ""}`}>
                  <div className="proj-head">
                    <span className="proj-year">{p.year}</span>
                    {p.status === "RESEARCH" && <span className="proj-status proj-status--live">research</span>}
                    {p.status === "COMPLETE" && <span className="proj-status">complete</span>}
                  </div>
                  <h3 className="proj-title">
                    {p.link ? (
                      <a href={p.link} target="_blank" rel="noopener noreferrer">{p.name} <Icon name="ext" size={13} /></a>
                    ) : p.name}
                  </h3>
                  <p className="proj-desc">{p.desc}</p>
                  {p.impact && <p className="proj-impact"><span>→</span> {p.impact}</p>}
                  <div className="proj-tags">{p.tags.map((t) => <span className="proj-tag" key={t}>{t}</span>)}</div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SKILLS ──────────────────────────────────────────────────────── */}
      <section id="skills">
        <div className="wrap">
          <Reveal className="section-head">
            <div className="section-title-row">
              <span className="section-icon-badge section-icon-badge--blue"><Icon name="code" size={20} /></span>
              <h2 className="section-title">Lexi<em>con</em></h2>
            </div>
          </Reveal>
          <div className="lexicon">
            <Reveal>
              <div className="lex-card">
                <div className="lex-head">
                  <span className="lex-class-ic"><Icon name="code" size={15} /></span>
                  <span className="lex-class">Full-Stack</span>
                </div>
                <div className="lex-terms lex-terms--padded">{content.skills.filter((s) => s.cat === "stack").map((s) => <span className="term term--prio" key={s.id}>{s.label}</span>)}</div>
              </div>
            </Reveal>
            <Reveal>
              <div className="lex-card">
                <div className="lex-head">
                  <span className="lex-class-ic"><Icon name="flask" size={15} /></span>
                  <span className="lex-class">AI / NLP</span>
                </div>
                <div className="lex-terms lex-terms--padded">{content.skills.filter((s) => s.cat === "ai").map((s) => <span className="term term--prio term--violet" key={s.id}>{s.label}</span>)}</div>
              </div>
            </Reveal>
            <Reveal>
              <div className="lex-card">
                <div className="lex-head">
                  <span className="lex-class-ic"><Icon name="wrench" size={15} /></span>
                  <span className="lex-class">DevOps &amp; Workflow</span>
                </div>
                <div className="lex-terms lex-terms--padded">{devopsTerms.map((t) => <span className="term" key={t}>{t}</span>)}</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FOOTER / CONTACT ────────────────────────────────────────────── */}
      <footer id="contact">
        <div className="wrap">
          <div className="footer-band">
            <span className="footer-band-line" />
            <span className="footer-band-label">let's talk</span>
            <span className="footer-band-line" />
          </div>
          <div className="footer-top">
            <div className="footer-cta">
              <label className="footer-slogan" htmlFor="footer-mail">Have a role, a project, or a research itch?</label>
              <a className="footer-email" id="footer-mail" href={email}>{content.links.find((l) => l.label === "EMAIL")?.value || "hazem.alabiad@icloud.com"}</a>
              <p>{get(content, "contactIntro", "Open to roles in NLP, AI/LLM engineering, and full-stack software engineering — reach out directly or find me on any of the links below.")}</p>
            </div>
            <div className="footer-links">
              <a className="linked ic-gh" href={content.links.find((l) => l.label === "GITHUB")?.href || "#"} target="_blank" rel="noopener noreferrer"><Icon name="gh" size={15} />github.com/hazem-alabiad</a>
              <a className="linked ic-in" href={content.links.find((l) => l.label === "LINKEDIN")?.href || "#"} target="_blank" rel="noopener noreferrer"><Icon name="in" size={15} />linkedin.com/in/hazemalabiad</a>
              <a className="linked ic-go" href={content.links.find((l) => l.label === "SCHOLAR")?.href || "#"} target="_blank" rel="noopener noreferrer"><Icon name="scholar" size={15} />{content.links.find((l) => l.label === "SCHOLAR")?.value || "scholar.google.com/hazem"}</a>
            </div>
          </div>
          <div className="hobbies">
            <div className="hobbies-head">
              <span className="hobbies-caret">$</span>
              <span className="hobbies-cmd">hobbies --interactive</span>
            </div>
            <div className="hobbies-grid">
              {[
                ["pen", "drawing"],
                ["mic", "voiceover"],
                ["globe", "travelling"],
                ["mountain", "hiking"],
                ["bike", "biking"],
                ["ball", "sports"],
                ["book", "history"],
                ["chart", "finance"],
                ["scales", "socioeconomics"],
              ].map(([ic, label], i) => (
                <div className="hobby" key={label} style={{ "--d": `${i * 22}ms` } as React.CSSProperties}>
                  <span className="hobby-idx">{String(i + 1).padStart(2, "0")}</span>
                  <Icon name={ic} size={17} />
                  <span className="hobby-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="footer-meta">
            <span {...ep("footerLine", "", {}, save, cmsEnabled)} className="copyright">
              {get(content, "footerLine", "© {year} Hazem Alabiad — Tübingen, Germany").replace("{year}", String(new Date().getFullYear()))}
            </span>
            <span className="footer-visits">visits <b>{visits.toLocaleString()}</b></span>
          </div>
        </div>
      </footer>
        </>
      )}

      {blogRoute.view === "blog" && <BlogIndex onOpen={(slug) => goBlog(slug)} onManage={() => goBlog("admin")} />}
      {blogRoute.view === "admin" && (
        <section className="blog" id="blog">
          <div className="wrap">
            <button className="btn blog-back" onClick={() => goBlog()}>← all notes</button>
            <BlogAdmin />
          </div>
        </section>
      )}
      {blogRoute.view === "post" && <BlogPost slug={blogRoute.slug} onBack={exitBlog} />}

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <Shortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} onJump={scrollTo} />
      <CMSButton enabled={cmsEnabled} onUnlock={() => setCmsEnabled(true)} onDisable={() => setCmsEnabled(false)} onOpenEditor={() => setEditorOpen(true)} />
      {cmsEnabled && editorOpen && (
        <CmsEditor
          initial={content}
          onSave={(c) => { saveAll(c); setEditorOpen(false); }}
          onReset={() => { resetContent(); setContent(loadContent()); setEditorOpen(false); }}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </>
  );
}
