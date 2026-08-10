import { useEffect, useRef, useState } from "react";
import {
  loadContent, saveContent, resetContent,
  type CmsContent,
} from "../cms";
import CmsEditor from "../CmsEditor";

/* ── reveal-on-scroll wrapper ──────────────────────────────────────────── */
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

/* ── CMS unlock button (GitHub PAT gate, same as before) ──────────────── */
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
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${token.trim()}`, "User-Agent": "hazem-portfolio" },
      });
      const data = await res.json();
      if (data.login === "hazem-alabiad") { setOpen(false); onUnlock(); }
      else { setErr("Token does not match owner."); }
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
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.1em", marginBottom: 8 }}>
            UNLOCK CMS
          </div>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="GitHub PAT" type="password"
            style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--rule)", color: "var(--ink)", fontFamily: "var(--font-mono)", fontSize: 12, padding: "7px 9px", borderRadius: 3, outline: "none" }} />
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

/* ── inline-edit helpers (CMS mode) ───────────────────────────────────── */
function get(content: CmsContent, key: keyof CmsContent, fallback: string): string {
  const v = content[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}
function ep(key: keyof CmsContent, fallback: string, base: React.CSSProperties, onSave: (k: keyof CmsContent, v: string) => void, enabled: boolean): React.HTMLAttributes<HTMLSpanElement> & { style: React.CSSProperties } {
  const style: React.CSSProperties = { ...base, outline: enabled ? "1px dashed rgba(217,164,65,0.5)" : "none", borderRadius: 2, cursor: enabled ? "text" : "default" };
  return {
    style,
    contentEditable: enabled ? true : undefined,
    suppressContentEditableWarning: true,
    onBlur: enabled ? (e) => { const t = (e.target as HTMLElement).textContent || ""; if (t !== fallback) onSave(key, t); } : undefined,
  };
}

/* ═══════════════════════════════════════════════════════════════════════
   APP
   ═══════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [content, setContent] = useState<CmsContent>(() => loadContent());
  const [cmsEnabled, setCmsEnabled] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  function save(key: keyof CmsContent, value: string) {
    setContent((prev) => { const next = { ...prev, [key]: value }; saveContent(next); return next; });
  }
  function saveAll(next: CmsContent) { setContent(next); saveContent(next); }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  const email = content.links.find((l) => l.label === "EMAIL")?.href
    || (`mailto:${content.links.find((l) => l.label === "EMAIL")?.value || ""}`);
  const gh = content.links.find((l) => l.label === "GITHUB")?.href || "#";
  const li = content.links.find((l) => l.label === "LINKEDIN")?.href || "#";
  const scholar = content.links.find((l) => l.label === "SCHOLAR")?.href || "#";

  const stackTerms = content.skills.filter((s) => s.cat === "stack").flatMap((s) => s.label.split("/").map((t) => t.trim()).filter(Boolean));
  const aiTerms = content.skills.filter((s) => s.cat === "ai").flatMap((s) => s.label.split("/").map((t) => t.trim()).filter(Boolean));
  const devopsTerms = ["Docker", "Git", "Jest", "Cypress", "Puppeteer", "Figma", "MySQL", "Agile", "Linux", "CI/CD"];

  const statNum = (s: { to: number; suffix: string }) => (s.to > 0 ? `${s.to}${s.suffix}` : s.suffix);

  return (
    <>
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav>
        <div className="wrap">
          <button className="nav-mark" onClick={() => scrollTo("home")}>H<span>.</span>ALABIAD</button>
          <div className="nav-links">
            <a href="#experience" onClick={() => scrollTo("experience")}>Experience</a>
            <a href="#research" onClick={() => scrollTo("research")}>Research</a>
            <a href="#skills" onClick={() => scrollTo("skills")}>Skills</a>
            <a href="#education" onClick={() => scrollTo("education")}>Education</a>
            <a href="#contact" onClick={() => scrollTo("contact")}>Contact</a>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <header className="hero" id="home">
        <div className="wrap">
          <div className="eyebrow">{get(content, "factLocation", "Tübingen, Germany")} — {get(content, "factDegree", "M.A. Computational Linguistics")}</div>
          <h1 className="name">Hazem Alabiad</h1>

          <div className="gloss">
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

          <p {...ep("heroTagline", "", { maxWidth: 600, marginBottom: 40, display: "block" }, save, cmsEnabled)}>
            {get(content, "heroTagline", "Software engineer with 6+ years building production systems and clean interfaces. Currently researching LLM AI-tutors and cognitive & AI as part of an M.A. in Computational Linguistics — bridging engineering, NLP, and cognitive science.")}
          </p>

          <div className="cta-row">
            <a className="btn primary" href={email}>Get in touch</a>
            <a className="btn" href={gh} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="btn" href={li} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a className="btn" href={scholar} target="_blank" rel="noopener noreferrer">Scholar</a>
          </div>

          <div className="stats">
            {content.stats.map((s, i) => (
              <div className="stat" key={i}>
                <div className="stat-num">{statNum(s)}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── EXPERIENCE ──────────────────────────────────────────────────── */}
      <section id="experience">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="section-gloss"><b>n.</b> — a chronological record of applied work</div>
            <h2 className="section-title">Exper<em>ience</em></h2>
          </div>

          <div className="timeline">
            {content.experience.map((exp, i) => (
              <Reveal key={exp.id}>
                <div className="entry">
                  <div className="entry-meta">
                    <span className="entry-date">{exp.period}</span>
                    {exp.current && <span className="entry-current">current</span>}
                  </div>
                  <h3 className="entry-role">{exp.role}</h3>
                  <p className="entry-org"><b>{exp.company}</b>{exp.location ? ` · ${exp.location}` : ""}</p>
                  <ul>
                    {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
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
                    <div className="cite-tags">
                      {p.tags.map((t) => <span className="cite-tag" key={t}>{t}</span>)}
                    </div>
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
            <Reveal>
              <div className="lex-row">
                <div className="lex-class">Full-Stack</div>
                <div className="lex-terms">
                  {stackTerms.map((t) => <span className="term" key={t}>{t}</span>)}
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="lex-row">
                <div className="lex-class">AI / NLP</div>
                <div className="lex-terms">
                  {aiTerms.map((t) => <span className="term" key={t}>{t}</span>)}
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="lex-row">
                <div className="lex-class">DevOps &amp; Workflow</div>
                <div className="lex-terms">
                  {devopsTerms.map((t) => <span className="term" key={t}>{t}</span>)}
                </div>
              </div>
            </Reveal>
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
            {content.languages.map((l) => (
              <div className="lang" key={l.id}><b>{l.name}</b> <span>— {l.level.toLowerCase()}</span></div>
            ))}
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
              <a href={gh} target="_blank" rel="noopener noreferrer">github.com/hazem-alabiad</a>
              <a href={li} target="_blank" rel="noopener noreferrer">linkedin.com/in/hazemalabiad</a>
              <a href={scholar} target="_blank" rel="noopener noreferrer">scholar.google.com</a>
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

      {/* ── CMS ─────────────────────────────────────────────────────────── */}
      <CMSButton
        enabled={cmsEnabled}
        onUnlock={() => setCmsEnabled(true)}
        onDisable={() => setCmsEnabled(false)}
        onOpenEditor={() => setEditorOpen(true)}
      />
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
