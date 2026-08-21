import { useEffect, useState, useRef, useMemo } from "react";
import { Icon } from "./Icon";
import { type CmsContent } from "../../cms";
import hazemPhoto from "../../imports/hazem-photo.webp";
import cvPdf from "../../imports/Hazem-Alabiad-CV.pdf";

const TERM_ROLES = [
  { t: "NLP / AI / LLM Research", p: true, tag: "focus" },
  { t: "Full-Stack Engineering", p: true, tag: "focus" },
  { t: "Student Assistant · LLM AI-Tutor", p: false, tag: "current" },
  { t: "Research Assistant · Cognitive & AI (IWM)", p: false, tag: "current" },
];

function get(content: CmsContent, key: keyof CmsContent, fallback: string): string {
  const v = content[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export function TerminalHero({ content, factLocation, scrollTo }: { content: CmsContent; factLocation: string; scrollTo: (id: string) => void }) {
  const [typed, setTyped] = useState(false);
  const [cmd, setCmd] = useState("");
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    if (reduce) { setTyped(true); setCmd("./job --status"); return; }
    let i = 0;
    const text = "./job --status";
    const iv = setInterval(() => { 
      setCmd(text.slice(0, i + 1)); 
      i++; 
      if (i >= text.length) { 
        clearInterval(iv); 
        setTimeout(() => setTyped(true), 250); 
      } 
    }, 45);
    return () => clearInterval(iv);
  }, [reduce]);

  const replay = () => {
    if (reduce) return;
    setTyped(false);
    setCmd("");
    let i = 0;
    const text = "./job --status";
    const iv = setInterval(() => { 
      setCmd(text.slice(0, i + 1)); 
      i++; 
      if (i >= text.length) { 
        clearInterval(iv); 
        setTimeout(() => setTyped(true), 250); 
      } 
    }, 45);
  };

  useEffect(() => {
    if (reduce) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      replay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
          <div className="term-titlebar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span className="term-dot term-dot-red" />
              <span className="term-dot term-dot-yellow" />
              <span className="term-dot term-dot-green" />
              <span className="term-title">hazem@tübingen — zsh — 80×24</span>
            </div>
            <button 
              onClick={replay} 
              title="Replay animation (R)"
              style={{ background: "none", border: "none", color: "var(--ink-faint)", cursor: "pointer", display: "flex", padding: 4 }}
              aria-label="Replay animation"
            >
              <Icon name="refresh" size={12} />
            </button>
          </div>
          <div className="term-body">
            <div className="term-line"><span className="term-ok">✓</span> hazem-alabiad.ini loaded — {TERM_ROLES.length} roles · {factLocation}</div>
            <div className="term-line">
              <span className="term-arrow">➜</span> <span className="term-path">~/portfolio</span> <span className="term-cmd">{cmd}</span><span className={`term-cursor${reduce ? " term-cursor--static" : ""}`} />
            </div>

            {typed && (
              <div className="term-output">
                <div className="term-sub"><span className="term-arrow">➜</span> cat roles.toml</div>
                <div className="term-roles">
                  {TERM_ROLES.map((r, i) => (
                    <div className={`term-role ${r.p ? "term-role--prio" : ""}`} key={r.t}>
                      <span className="term-idx">{String(i + 1).padStart(2, "0")}</span>
                      <span className="term-role-name">{r.t}</span>
                      <span className="term-fill" />
                      {r.tag === "focus" && <span className="term-tag term-tag--focus">focus</span>}
                      {r.tag === "current" && <span className="term-tag">current</span>}
                      {r.p && <span className="term-priority">◀ priority</span>}
                    </div>
                  ))}
                </div>
                <div className="term-sub"><span className="term-arrow">➜</span> cat status.json</div>
                <div className="term-rows">
                  {content.education.filter((e) => e.current).map((e) => (
                    <div className="term-current" key={e.id}>
                      <span className="term-arrow">›</span>
                      <span className="term-current-degree">{e.degree}</span>
                      <span className="term-current-sep">· {e.school}</span>
                      <span className="term-current-sep">· <em>{e.location}</em></span>
                      <span className="term-current-sep term-current-period">· {e.period}</span>
                      <span className="term-fill" />
                      <span className="term-tag">current</span>
                    </div>
                  ))}
                  <div className="term-kv term-kv--feature"><span className="term-k">experience</span><span className="term-ec">=&gt;</span><span className="term-v">"6+ years"</span></div>
                  <div className="term-kv term-kv--feature"><span className="term-k">open_to</span><span className="term-ec">=&gt;</span><span className="term-v">["Working Student", "NLP/AI/LLMs"]</span></div>
                  <div className="term-kv"><span className="term-k">languages</span><span className="term-ec">=&gt;</span><span className="term-v">[{content.languages.map((l) => `"${l.name.slice(0, 2).toUpperCase()}"`).join(", ")}]</span></div>
                </div>
                <div className="term-comment"># press <kbd>R</kbd> or click the refresh icon to replay</div>
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
