import { useEffect, useState, lazy, Suspense } from "react";
import { HashRouter, Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import { loadContent, saveContent, resetContent, type CmsContent } from "../cms";
import CmsEditor from "../CmsEditor";
import { BlogManagerProvider, useBlogManager } from "../blog/manager";
import { useSEO } from "../blog/seo";
import cvPdf from "../imports/Hazem-Alabiad-CV.pdf";
import qrSvg from "../imports/portfolio-qr.svg?raw";
import { Icon } from "./components/Icon";

import { BootScreen } from "./components/BootScreen";
import { TerminalHero } from "./components/TerminalHero";
import { Shortcuts } from "./components/Shortcuts";
const BgGlyphs = lazy(() => import("./components/BgGlyphs").then(m => ({ default: m.BgGlyphs })));
import { Reveal } from "./components/Reveal";
import { ScrollProgress } from "./components/ScrollProgress";
import { BackToTop } from "./components/BackToTop";
import { Toast } from "./components/Toast";
import { CMSButton } from "./components/CMSButton";

const BlogIndex = lazy(() => import("../blog/Blog").then(m => ({ default: m.BlogIndex })));
const BlogPost = lazy(() => import("../blog/Blog").then(m => ({ default: m.BlogPost })));
const BlogAdmin = lazy(() => import("../blog/BlogAdmin"));

const BOOTED_KEY = "hazem_portfolio_booted_v3";

function get(content: CmsContent, key: keyof CmsContent, fallback: string): string {
  const v = content[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

function ep(key: keyof CmsContent, fallback: string, base: React.CSSProperties, onSave: (k: keyof CmsContent, v: string) => void, enabled: boolean): React.HTMLAttributes<HTMLSpanElement> & { style: React.CSSProperties } {
  const style: React.CSSProperties = { ...base, outline: enabled ? "1px dashed rgba(217,164,65,0.5)" : "none", borderRadius: 2, cursor: enabled ? "text" : "default" };
  return { style, contentEditable: enabled ? true : undefined, suppressContentEditableWarning: true, onBlur: enabled ? (e) => { const t = (e.target as HTMLElement).textContent || ""; if (t !== fallback) onSave(key, t); } : undefined };
}

function SEOWrapper({ view }: { view: "home" | "blog" | "admin" }) {
  useSEO(view, undefined);
  return null;
}

function BlogPostWrapper() {
  const { slug } = useParams();
  const navigate = useNavigate();
  return <BlogPost slug={slug!} onBack={() => navigate("/blog")} />;
}

export default function App() {
  return (
    <HashRouter>
      <BlogManagerProvider>
        <AppContent />
      </BlogManagerProvider>
    </HashRouter>
  );
}

const SECTIONS = ["home", "education", "experience", "research", "skills", "contact"];
const devopsTerms = ["Docker", "Git", "Jest", "Cypress", "Puppeteer", "Figma", "MySQL", "Agile", "Linux", "CI/CD"];

function AppContent() {
  const [booted, setBooted] = useState<boolean>(() => { try { return localStorage.getItem(BOOTED_KEY) === "1"; } catch { return false; } });
  const [content, setContent] = useState<CmsContent>(() => loadContent());
  const blogManager = useBlogManager();
  const cmsEnabled = Boolean(blogManager.mgr);
  const setCmsEnabled = (enabled: boolean) => { if (!enabled) blogManager.lock(); };
  const [editorOpen, setEditorOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => { try { return localStorage.getItem("hazem_theme") === "light" ? "light" : "dark"; } catch { return "dark"; } });
  const [visits, setVisits] = useState(0);
  const [activeSection, setActiveSection] = useState("home");

  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";


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
    if (!isHome) {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth" });
        if (el) window.scrollTo({ top: el.offsetTop - 0 });
      }, 100);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const sectionIds = ["home", "education", "experience", "research", "skills", "contact"];
    const observers: IntersectionObserver[] = [];
    const visible = new Set<string>();
    const pick = () => {
      // pick the topmost visible section
      for (const id of sectionIds) { if (visible.has(id)) { setActiveSection(id); return; } }
    };
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const io = new IntersectionObserver(
        ([entry]) => { entry.isIntersecting ? visible.add(id) : visible.delete(id); pick(); },
        { threshold: 0.15 }
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((io) => io.disconnect());
  }, [isHome]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); setShortcutsOpen(true); return; }
      if (e.key === "Escape") { setShortcutsOpen(false); setMenuOpen(false); return; }
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
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
        case "d": { const a = document.createElement("a"); a.href = cvUrl; a.download = "Hazem-Alabiad-CV.pdf"; a.click(); break; }
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
  }, [shortcutsOpen, email, cvUrl, isHome]);

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <ScrollProgress />
      <BackToTop />
      {!booted && <BootScreen onDone={() => { setBooted(true); try { localStorage.setItem(BOOTED_KEY, "1"); } catch { /* empty */ } }} />}

      <nav>
        <div className="wrap">
          <button className="nav-mark" onClick={() => { setMenuOpen(false); scrollTo("home"); }}>H<span>.</span>ALABIAD</button>
          <div className="nav-links">
            <a href="#education" onClick={(e) => { e.preventDefault(); scrollTo("education"); }} className={isHome && activeSection === "education" ? "nav-active" : ""}>Education</a>
            <a href="#experience" onClick={(e) => { e.preventDefault(); scrollTo("experience"); }} className={isHome && activeSection === "experience" ? "nav-active" : ""}>Experience</a>
            <a href="#research" onClick={(e) => { e.preventDefault(); scrollTo("research"); }} className={isHome && activeSection === "research" ? "nav-active" : ""}>Research</a>
            <a href="#skills" onClick={(e) => { e.preventDefault(); scrollTo("skills"); }} className={isHome && activeSection === "skills" ? "nav-active" : ""}>Skills</a>
            <a href="#blog" onClick={(e) => { e.preventDefault(); navigate("/blog"); }} className={`nav-blog${location.pathname.startsWith("/blog") ? " nav-active" : ""}`}>Blog</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); scrollTo("contact"); }} className={isHome && activeSection === "contact" ? "nav-active" : ""}>Contact</a>
            <button className="nav-shorts" onClick={() => setShortcutsOpen(true)} title="Search & shortcuts (⌘K)">⌘K</button>
            <button className="nav-theme" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-label="Toggle theme">{theme === "dark" ? "☀" : "☾"}</button>
            <button className="nav-hire" onClick={() => { navigator.clipboard?.writeText(email.replace("mailto:", "")); setToast("Email copied — hazem.alabiad@icloud.com"); }}>Hire me</button>
          </div>
          <button className={`nav-toggle ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="nav-menu">
            <span /><span /><span />
          </button>
        </div>
        <div className={`nav-menu ${menuOpen ? "open" : ""}`} id="nav-menu">
          <a href="#education" onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollTo("education"); }}>Education</a>
          <a href="#experience" onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollTo("experience"); }}>Experience</a>
          <a href="#research" onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollTo("research"); }}>Research</a>
          <a href="#skills" onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollTo("skills"); }}>Skills</a>
          <a href="#blog" onClick={(e) => { e.preventDefault(); setMenuOpen(false); navigate("/blog"); }}>Blog</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); setMenuOpen(false); scrollTo("contact"); }}>Contact</a>
          <div className="nav-menu-actions">
            <button className="nav-shorts" onClick={() => { setMenuOpen(false); setShortcutsOpen(true); }} title="Search & shortcuts (⌘K)">⌘K</button>
            <button className="nav-hire" onClick={() => { navigator.clipboard?.writeText(email.replace("mailto:", "")); setToast("Email copied — hazem.alabiad@icloud.com"); setMenuOpen(false); }}>Hire me</button>
          </div>
        </div>
      </nav>

      <main id="main-content">
        <Routes>
          <Route path="/" element={
          <>
            <SEOWrapper view="home" />
            <Suspense fallback={null}><BgGlyphs /></Suspense>
            <TerminalHero content={content} factLocation={factLocation} scrollTo={scrollTo} />
            
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
                      <div className="lex-terms lex-terms--padded">{content.skills.filter((s) => s.cat === "stack").map((s, i) => <span className="term term--prio" style={{ "--i": i } as React.CSSProperties} key={s.id}>{s.label}</span>)}</div>
                    </div>
                  </Reveal>
                  <Reveal>
                    <div className="lex-card">
                      <div className="lex-head">
                        <span className="lex-class-ic"><Icon name="flask" size={15} /></span>
                        <span className="lex-class">AI / NLP</span>
                      </div>
                      <div className="lex-terms lex-terms--padded">{content.skills.filter((s) => s.cat === "ai").map((s, i) => <span className="term term--prio term--violet" style={{ "--i": i } as React.CSSProperties} key={s.id}>{s.label}</span>)}</div>
                    </div>
                  </Reveal>
                  <Reveal>
                    <div className="lex-card">
                      <div className="lex-head">
                        <span className="lex-class-ic"><Icon name="wrench" size={15} /></span>
                        <span className="lex-class">DevOps &amp; Workflow</span>
                      </div>
                      <div className="lex-terms lex-terms--padded">{devopsTerms.map((t, i) => <span className="term" style={{ "--i": i } as React.CSSProperties} key={t}>{t}</span>)}</div>
                    </div>
                  </Reveal>
                </div>
              </div>
            </section>
          </>
        } />

        <Route path="/blog/*" element={
          <Suspense fallback={<div className="wrap" style={{ padding: "120px 20px", textAlign: "center", color: "var(--ink-faint)", fontFamily: "var(--font-mono)" }}>Loading blog...</div>}>
              <Routes>
                <Route path="/" element={<><SEOWrapper view="blog" /><BlogIndex onOpen={(slug) => navigate(`/blog/${slug}`)} /></>} />
                <Route path="/admin" element={
                  <section className="blog" id="blog">
                    <SEOWrapper view="admin" />
                    <div className="wrap">
                      <button className="btn blog-back" onClick={() => navigate("/blog")}>← all notes</button>
                      <BlogAdmin />
                    </div>
                  </section>
                } />
                <Route path="/:slug" element={<BlogPostWrapper />} />
              </Routes>
            </Suspense>
        } />
        </Routes>
      </main>

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
            <div className="footer-qr">
              <div className="footer-qr-tile" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <span className="footer-qr-caption">scan me</span>
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

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
      <Shortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} onJump={scrollTo} onOpenPost={(slug) => navigate(`/blog/${slug}`)} />
      <CMSButton enabled={cmsEnabled} onUnlock={(token) => blogManager.unlock(token)} onDisable={() => setCmsEnabled(false)} onOpenEditor={() => setEditorOpen(true)} />
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
