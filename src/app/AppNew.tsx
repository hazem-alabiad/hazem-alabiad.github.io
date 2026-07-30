import { useState, useEffect, useRef, useCallback } from "react";
import "../styles/new-theme.css";
import {
  Github, Linkedin, Mail, MapPin, Download, ArrowUpRight, ExternalLink
} from "lucide-react";
import profilePhoto from "@/imports/IMG_0323.jpeg";
import cvAsset from "@/imports/Hazem-Alabiad-CV.pdf?url";
import { resolveCvHref, resolveCvName } from "./cv";

/* ── Palette (mirrors CSS vars) ─────────────────────────── */
const C = {
  bg:       "#070b14",
  card:     "#0d1220",
  hover:    "#111827",
  border:   "rgba(99,179,237,0.12)",
  borderHi: "rgba(99,179,237,0.35)",
  accent:   "#63b3ed",
  accent2:  "#9f7aea",
  hi:       "#e2e8f0",
  mid:      "#94a3b8",
  lo:       "#475569",
};

const MONO:    React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF:   React.CSSProperties = { fontFamily: "'Playfair Display', serif" };
const SANS:    React.CSSProperties = { fontFamily: "'Inter', sans-serif" };

/* ── CV Data (static — mirrors main branch seed) ─────────── */
const CV = {
  name: "Hazem Alabiad",
  tagline: "Software Engineer · AI · NLP · Computational Linguistics",
  location: "Tübingen, Germany",
  email: "hazem.alabiad@icloud.com",
  github: "https://github.com/hazem-alabiad",
  linkedin: "https://linkedin.com/in/hazemalabiad",
  bio: "M.A. student in Computational Linguistics at Tübingen with 6+ years of software engineering experience building production-ready systems. Bridging full-stack engineering and intelligent systems — from IBM enterprise UIs to LLM research. Open to working student & research roles in NLP, AI/ML, and LLMs.",
  badges: ["TypeScript", "React", "Python", "LLMs", "NLP", "Node.js"],
  skills: [
    { label: "Full-Stack",  items: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL", "Apollo Federation", "Redux", "WebSocket", "Elasticsearch"] },
    { label: "AI / NLP",   items: ["Python", "LLMs", "NLP", "TensorFlow", "Transfer Learning", "Pandas", "R", "Data Engineering"] },
    { label: "DevOps",     items: ["Docker", "Git", "Linux", "Jest", "Cypress", "Playwright", "Puppeteer", "MySQL", "Agile"] },
  ],
  experience: [
    { role: "Research Assistant",              company: "University of Tübingen",     period: "Jul 2026 – Present",    bullets: ["LLM-based AI tutor for university lectures"] },
    { role: "Research Assistant",              company: "IWM (Leibniz)",              period: "Jul 2026 – Present",    bullets: ["Social media (TikTok) impact research"] },
    { role: "Software Engineer (Working Stud)",company: "IBM",                        period: "Jun 2024 – Apr 2026",   bullets: ["Production React UI for IBM Data Quality (1M+ users) · IBM Carbon + TypeScript", "300+ regression & E2E tests · Puppeteer & Cypress", "Led a11y improvements: ARIA, screen reader, keyboard nav"] },
    { role: "Frontend Developer",              company: "Getir",                      period: "Dec 2022 – Mar 2024",   bullets: ["GetirJobs (2.2M+ users) · 2 greenfield React/TS projects", "3× dev-server speedup via Vite migration", "70% component test coverage with Playwright & Jest"] },
    { role: "Engineering Lead",                company: "Arianna Suisse Sa",          period: "Jun 2022 – Nov 2022",   bullets: ["Led 4 engineers · GraphQL API with Apollo Federation · MySQL", "Technical hiring (50+ candidates), onboarded 4 engineers"] },
    { role: "Full-Stack Developer",            company: "Arianna Suisse Sa",          period: "May 2021 – Jun 2022",   bullets: ["Reusable React components · GraphQL server · ~90% Jest coverage", "Custom Elasticsearch engine · real-time WebSocket editing"] },
    { role: "Freelance Developer",             company: "Remote (US)",                period: "Feb 2020 – Feb 2021",   bullets: ["Pixel-perfect React UIs for 3 international clients", "Python web crawlers → RabbitMQ → AI backend pipelines"] },
    { role: "QA Automation Engineer",          company: "Bayzat (UAE)",               period: "Jan 2019 – Nov 2019",   bullets: ["Built Cypress E2E suites from scratch; reduced manual testing overhead"] },
  ],
  projects: [
    { title: "Multiword Expressions in Arabic", year: "2026", desc: "LLM extraction of Arabic verbal MWEs from large corpora.",            link: "https://github.com/hazem-alabiad/MWE" },
    { title: "Content Rating System",           year: "2022", desc: "NLP/DL age-appropriateness classifier for books.",                    link: "https://github.com/hazem-alabiad/content-rating-system" },
    { title: "Taxi Tip Estimator",              year: "2021", desc: "ML/DL predictor on NYC trip data to estimate gratuity.",             link: "https://github.com/hazem-alabiad/taxi-tip-estimator" },
    { title: "Automated Essay Grading",         year: "2019", desc: "LSTM-based pipeline for automated scoring of student essays.",       link: "https://github.com/hazem-alabiad/essay-grading" },
  ],
  education: [
    { degree: "M.A. Computational Linguistics", school: "Universität Tübingen",  period: "Oct 2023 – Present",  notes: "LLMs · NLP · Corpus Linguistics · Cognitive Science · ML" },
    { degree: "B.Sc. Computer Engineering",     school: "Hacettepe University",  period: "Sep 2015 – Jun 2019", notes: "Honor Student · Top 10% · GPA 3.41 · YTB Scholarship" },
  ],
  languages: [
    { name: "Arabic",  level: "Native",    flag: "🇸🇦" },
    { name: "English", level: "Proficient", flag: "🇬🇧" },
    { name: "Turkish", level: "Proficient", flag: "🇹🇷" },
    { name: "German",  level: "Beginner",   flag: "🇩🇪" },
  ],
};

/* ── Neural-network canvas background ───────────────────── */
type Node = { x: number; y: number; vx: number; vy: number; label: string };

const TOKENS = [
  "NLP", "LLM", "const", "∂loss", "→", "⟨token⟩",
  "import", "Arabic", "bert", "grad", "λ", "syntax",
  "attention", "φ", "corpus", "embed", "∑", "react",
  "python", "MWE", "∇", "GPU", "seq2seq", "CRF",
];

function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef  = useRef<Node[]>([]);
  const mouseRef  = useRef({ x: -9999, y: -9999 });
  const rafRef    = useRef<number>(0);

  const init = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;
    const count = Math.min(42, Math.floor((W * H) / 28000));
    nodesRef.current = Array.from({ length: count }, (_, i) => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      label: TOKENS[i % TOKENS.length],
    }));
  }, []);

  useEffect(() => {
    init();
    const onResize = () => { init(); };
    const onMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    const DIST   = 180;
    const MDIST  = 240;

    function draw() {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const nodes = nodesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // update
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
        // subtle mouse attraction
        const dx = mx - n.x, dy = my - n.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MDIST) { n.vx += (dx / d) * 0.012; n.vy += (dy / d) * 0.012; }
        // clamp speed
        const spd = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (spd > 1.2) { n.vx = (n.vx / spd) * 1.2; n.vy = (n.vy / spd) * 1.2; }
      }

      // draw edges
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < DIST) {
            const alpha = (1 - d / DIST) * 0.25;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(99,179,237,${alpha})`;
            ctx.lineWidth   = 0.8;
            ctx.stroke();
          }
        }
      }

      // draw nodes + labels
      for (const n of nodes) {
        const dx = mx - n.x, dy = my - n.y;
        const nearMouse = Math.sqrt(dx * dx + dy * dy) < 120;
        const r = nearMouse ? 4 : 2.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = nearMouse ? "rgba(159,122,234,0.9)" : "rgba(99,179,237,0.55)";
        ctx.fill();

        if (nearMouse) {
          ctx.font      = "11px 'JetBrains Mono', monospace";
          ctx.fillStyle = "rgba(159,122,234,0.75)";
          ctx.fillText(n.label, n.x + 8, n.y - 6);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [init]);

  return <canvas ref={canvasRef} id="neural-canvas" style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.5 }} />;
}

/* ── Small helpers ───────────────────────────────────────── */
function Tag({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <span style={{
      ...MONO, fontSize: 11, padding: "3px 10px", borderRadius: 6,
      border: `1px solid ${accent ? C.borderHi : C.border}`,
      background: accent ? "rgba(99,179,237,0.07)" : "rgba(255,255,255,0.03)",
      color: accent ? C.accent : C.mid,
    }}>{children}</span>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: C.accent, opacity: 0.7, whiteSpace: "nowrap" }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ ...SANS, display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.lo, textDecoration: "none", transition: "color .2s" }}
      onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = C.accent}
      onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = C.lo}>
      {icon} {label}
    </a>
  );
}

/* ── App ─────────────────────────────────────────────────── */
export default function AppNew() {
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.35 }
    );
    sections.forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const navItems: [string, string][] = [
    ["About", "hero"], ["Education", "education"], ["Experience", "experience"],
    ["Projects", "projects"], ["Skills", "skills"],
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.mid, position: "relative" }}>
      <NeuralCanvas />

      {/* ── Nav ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 48px",
        background: "rgba(7,11,20,0.82)", backdropFilter: "blur(18px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{ ...SERIF, fontSize: 17, color: C.hi, letterSpacing: ".01em" }}>{CV.name}</span>
        <div style={{ display: "flex", gap: 32 }}>
          {navItems.map(([label, id]) => (
            <a key={id} href={`#${id}`} style={{
              ...MONO, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
              color: activeSection === id ? C.accent : C.lo,
              textDecoration: "none", transition: "color .2s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.color = C.accent}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.color = activeSection === id ? C.accent : C.lo}>
              {label}
            </a>
          ))}
        </div>
        <a href={`mailto:${CV.email}`} style={{ ...MONO, fontSize: 11, color: C.accent, textDecoration: "none" }}>{CV.email}</a>
      </nav>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "0 32px", paddingTop: 120, paddingBottom: 96, position: "relative", zIndex: 1 }}>

        {/* ── Hero ── */}
        <section id="hero" style={{ marginBottom: 96 }}>
          <div style={{ display: "flex", flexDirection: "row", gap: 48, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <p style={{ ...MONO, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.accent, marginBottom: 18, opacity: 0.8 }}>Available · Open to Opportunities</p>
              <h1 style={{ ...SERIF, fontSize: "clamp(2.4rem,5.5vw,3.8rem)", color: C.hi, lineHeight: 1.08, marginBottom: 12 }}>
                {CV.name}
              </h1>
              <p style={{ ...MONO, fontSize: 12, color: C.accent2, marginBottom: 22, letterSpacing: ".04em" }}>{CV.tagline}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                {CV.badges.map(b => <Tag key={b} accent>{b}</Tag>)}
              </div>
              <p style={{ ...SANS, fontSize: 15, lineHeight: 1.85, color: "#b0bec5", maxWidth: "52ch", marginBottom: 32 }}>{CV.bio}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
                <a href={`mailto:${CV.email}`} style={{
                  ...SANS, display: "flex", alignItems: "center", gap: 8, padding: "9px 20px",
                  borderRadius: 8, background: C.accent, color: C.bg, fontSize: 13,
                  fontWeight: 600, textDecoration: "none", border: "none",
                }}>
                  <Mail size={13} /> Get in touch
                </a>
                <a href={resolveCvHref({ cvUrl: "", cvFileData: undefined, cvFileName: undefined }, cvAsset)}
                  download={resolveCvName({ cvUrl: "", cvFileName: undefined }, "Hazem-Alabiad-CV.pdf")}
                  style={{
                    ...SANS, display: "flex", alignItems: "center", gap: 8, padding: "9px 20px",
                    borderRadius: 8, border: `1px solid ${C.border}`, color: C.mid,
                    fontSize: 13, textDecoration: "none", background: "transparent",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = C.borderHi; el.style.color = C.hi; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = C.border; el.style.color = C.mid; }}>
                  <Download size={13} /> Download CV
                </a>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                <SocialLink href={CV.github}   icon={<Github   size={13} />} label="GitHub" />
                <SocialLink href={CV.linkedin} icon={<Linkedin size={13} />} label="LinkedIn" />
                <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: C.lo }}>
                  <MapPin size={13} /> {CV.location}
                </span>
              </div>
            </div>

            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              <div style={{
                width: 148, height: 148, borderRadius: "50%", overflow: "hidden",
                boxShadow: `0 0 0 1.5px ${C.borderHi}, 0 0 40px rgba(99,179,237,0.12)`,
              }}>
                <img src={profilePhoto} alt={CV.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 4%", filter: "brightness(0.9) contrast(1.05) saturate(0.85)" }} />
              </div>
              {/* Language flags */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
                {CV.languages.map(l => (
                  <span key={l.name} title={`${l.name} — ${l.level}`} style={{ fontSize: 20, cursor: "default" }}>{l.flag}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Education ── */}
        <section id="education" style={{ marginBottom: 80, scrollMarginTop: 80 }}>
          <SectionHead label="Education" />
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {CV.education.map(edu => (
              <div key={edu.degree} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8,
              }}>
                <div>
                  <p style={{ ...SANS, fontSize: 15, fontWeight: 600, color: C.hi, marginBottom: 4 }}>{edu.degree}</p>
                  <p style={{ ...SANS, fontSize: 13, color: C.accent, marginBottom: 6 }}>{edu.school}</p>
                  <p style={{ ...SANS, fontSize: 13, color: C.lo }}>{edu.notes}</p>
                </div>
                <span style={{ ...MONO, fontSize: 11, color: C.lo, whiteSpace: "nowrap" }}>{edu.period}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Experience ── */}
        <section id="experience" style={{ marginBottom: 80, scrollMarginTop: 80 }}>
          <SectionHead label="Experience" />
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {CV.experience.map((exp, i) => (
              <div key={i} style={{ display: "flex", gap: 20, paddingBottom: 28, position: "relative" }}>
                {/* timeline line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.accent, opacity: 0.5, marginTop: 6 }} />
                  {i < CV.experience.length - 1 && <div style={{ width: 1, flex: 1, background: C.border, marginTop: 6 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                    <div>
                      <span style={{ ...SANS, fontSize: 14, fontWeight: 600, color: C.hi }}>{exp.role}</span>
                      <span style={{ ...SANS, fontSize: 13, color: C.accent, marginLeft: 8 }}>@ {exp.company}</span>
                    </div>
                    <span style={{ ...MONO, fontSize: 10, color: C.lo }}>{exp.period}</span>
                  </div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                    {exp.bullets.map((b, bi) => (
                      <li key={bi} style={{ ...SANS, fontSize: 13, color: C.mid, display: "flex", gap: 10 }}>
                        <span style={{ color: C.accent, opacity: 0.4, flexShrink: 0 }}>—</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Projects ── */}
        <section id="projects" style={{ marginBottom: 80, scrollMarginTop: 80 }}>
          <SectionHead label="Research & Projects" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {CV.projects.map(p => (
              <a key={p.title} href={p.link} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", textDecoration: "none", transition: "border-color .2s, background .2s" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = C.borderHi; el.style.background = C.hover; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = C.border; el.style.background = C.card; }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ ...MONO, fontSize: 10, color: C.accent, opacity: 0.65 }}>{p.year}</span>
                  <ExternalLink size={13} color={C.lo} />
                </div>
                <p style={{ ...SANS, fontSize: 14, fontWeight: 600, color: C.hi, marginBottom: 8 }}>{p.title}</p>
                <p style={{ ...SANS, fontSize: 13, color: C.mid, lineHeight: 1.7 }}>{p.desc}</p>
              </a>
            ))}
          </div>
        </section>

        {/* ── Skills ── */}
        <section id="skills" style={{ marginBottom: 80, scrollMarginTop: 80 }}>
          <SectionHead label="Skills" />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {CV.skills.map(sg => (
              <div key={sg.label} style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
                <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: C.accent, opacity: 0.65, minWidth: 88, paddingTop: 4 }}>{sg.label}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {sg.items.map(s => <Tag key={s}>{s}</Tag>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Languages ── */}
        <section id="languages" style={{ marginBottom: 0, scrollMarginTop: 80 }}>
          <SectionHead label="Languages" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {CV.languages.map(l => (
              <div key={l.name} style={{
                background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: "12px 20px", display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{l.flag}</span>
                <div>
                  <p style={{ ...SANS, fontSize: 13, fontWeight: 600, color: C.hi }}>{l.name}</p>
                  <p style={{ ...MONO, fontSize: 10, color: C.accent, opacity: 0.7 }}>{l.level}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 48px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ ...MONO, fontSize: 11, color: C.lo }}>© {new Date().getFullYear()} {CV.name} · Built with React + Vite · Designed with ♥</p>
      </footer>
    </div>
  );
}
