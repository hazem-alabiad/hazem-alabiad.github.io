import { useState, useEffect, useRef, useCallback } from "react";
import profilePhoto from "@/imports/IMG_0323.jpeg";
import cvAsset from "@/imports/Hazem-Alabiad-CV.pdf?url";
import { resolveCvHref, resolveCvName } from "./cv";
import {
  Github, Linkedin, Mail, MapPin, Download, ArrowUpRight, ExternalLink
} from "lucide-react";

/* ───────────────────────── THEME ───────────────────────── */
const T = {
  bg:       "#05070f",
  bgCard:   "#090d1a",
  bgGlass:  "rgba(9,13,26,0.72)",
  border:   "rgba(255,255,255,0.07)",
  borderHi: "rgba(100,210,255,0.4)",
  cyan:     "#64d2ff",
  purple:   "#a78bfa",
  pink:     "#f472b6",
  green:    "#34d399",
  textHi:   "#f0f4ff",
  textMid:  "#8892aa",
  textLo:   "#3d4560",
};

const F = {
  mono:  { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" } as React.CSSProperties,
  serif: { fontFamily: "'Fraunces', 'Georgia', serif" } as React.CSSProperties,
  sans:  { fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties,
};

/* ─────────────────── ANIMATED MESH BG ──────────────────── */
function MeshBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width  = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let t = 0;

    const orbs = [
      { x: 0.15, y: 0.2,  r: 0.38, color: "100,210,255",  spd: 0.0003 },
      { x: 0.75, y: 0.6,  r: 0.32, color: "167,139,250",  spd: 0.0004 },
      { x: 0.5,  y: 0.85, r: 0.28, color: "244,114,182",  spd: 0.00025 },
      { x: 0.88, y: 0.15, r: 0.22, color: "52,211,153",   spd: 0.00035 },
    ];

    function draw() {
      t++;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = T.bg;
      ctx.fillRect(0, 0, W, H);
      for (const o of orbs) {
        const px = (o.x + Math.sin(t * o.spd * 1.7) * 0.09) * W;
        const py = (o.y + Math.cos(t * o.spd) * 0.07) * H;
        const radius = o.r * Math.min(W, H);
        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
        grad.addColorStop(0,   `rgba(${o.color}, 0.18)`);
        grad.addColorStop(0.5, `rgba(${o.color}, 0.06)`);
        grad.addColorStop(1,   `rgba(${o.color}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }
      // subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.022)";
      ctx.lineWidth = 1;
      const step = 72;
      for (let x = 0; x < W; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      requestAnimationFrame(draw);
    }
    const raf = requestAnimationFrame(draw);
    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
}

/* ──────────────────── TYPEWRITER HOOK ──────────────────── */
const ROLES = [
  "Software Engineer",
  "NLP Researcher",
  "LLM Builder",
  "Computational Linguist",
  "Full-Stack Dev",
  "AI Enthusiast",
];

function useTypewriter() {
  const [display, setDisplay] = useState("");
  const [roleIdx, setRoleIdx] = useState(0);
  const [phase, setPhase] = useState<"typing"|"waiting"|"erasing">("typing");
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    const role = ROLES[roleIdx];
    if (phase === "typing") {
      if (charIdx < role.length) {
        const t = setTimeout(() => { setDisplay(role.slice(0, charIdx + 1)); setCharIdx(c => c + 1); }, 55);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("waiting"), 1800);
        return () => clearTimeout(t);
      }
    } else if (phase === "waiting") {
      const t = setTimeout(() => setPhase("erasing"), 400);
      return () => clearTimeout(t);
    } else {
      if (charIdx > 0) {
        const t = setTimeout(() => { setDisplay(role.slice(0, charIdx - 1)); setCharIdx(c => c - 1); }, 28);
        return () => clearTimeout(t);
      } else {
        setRoleIdx(i => (i + 1) % ROLES.length);
        setPhase("typing");
      }
    }
  }, [phase, charIdx, roleIdx]);

  return display;
}

/* ──────────────────── NAV ───────────────────────────────── */
const NAV_ITEMS: [string, string][] = [
  ["About", "about"], ["Experience", "experience"],
  ["Projects", "projects"], ["Skills", "skills"],
];

function Nav({ active }: { active: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px", height: 64,
      background: scrolled ? T.bgGlass : "transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(1.4)" : "none",
      borderBottom: scrolled ? `1px solid ${T.border}` : "none",
      transition: "all 0.4s ease",
    }}>
      {/* Logo mark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${T.cyan}, ${T.purple})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ ...F.mono, fontSize: 13, fontWeight: 700, color: "#05070f" }}>H</span>
        </div>
        <span style={{ ...F.mono, fontSize: 13, color: T.textHi, letterSpacing: ".04em" }}>hazem.dev</span>
      </div>

      <div style={{ display: "flex", gap: 36 }}>
        {NAV_ITEMS.map(([label, id]) => (
          <a key={id} href={`#${id}`} style={{
            ...F.mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: active === id ? T.cyan : T.textMid, textDecoration: "none",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.cyan}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = active === id ? T.cyan : T.textMid}>
            {label}
          </a>
        ))}
      </div>

      <a href="mailto:hazem.alabiad@icloud.com" style={{
        ...F.mono, fontSize: 11, color: T.bgCard,
        background: `linear-gradient(90deg, ${T.cyan}, ${T.purple})`,
        padding: "7px 16px", borderRadius: 20, textDecoration: "none",
        fontWeight: 600, letterSpacing: ".04em",
      }}>hire me</a>
    </nav>
  );
}

/* ──────────────────── SECTION LABEL ────────────────────── */
function SLabel({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 48 }}>
      <span style={{ ...F.mono, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase",
        background: `linear-gradient(90deg, ${T.cyan}, ${T.purple})`,
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>{text}</span>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.border}, transparent)` }} />
    </div>
  );
}

/* ──────────────────── SKILL PILL ───────────────────────── */
const SKILL_COLORS: Record<string, string> = {
  "Full-Stack":  T.cyan,
  "AI / NLP":   T.purple,
  "DevOps":     T.green,
};

function SkillPill({ text, group }: { text: string; group: string }) {
  const c = SKILL_COLORS[group] ?? T.cyan;
  return (
    <span style={{
      ...F.mono, fontSize: 11, padding: "5px 12px", borderRadius: 6,
      border: `1px solid ${c}33`,
      background: `${c}0d`,
      color: c,
      display: "inline-block",
    }}>{text}</span>
  );
}

/* ──────────────────── EXPERIENCE CARD ──────────────────── */
function ExpCard({ role, company, period, bullets, accent }: {
  role: string; company: string; period: string; bullets: string[]; accent: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "rgba(100,210,255,0.04)" : T.bgCard,
        border: `1px solid ${hover ? accent + "55" : T.border}`,
        borderRadius: 16, padding: "24px 28px",
        transition: "all 0.25s ease",
        position: "relative", overflow: "hidden",
      }}
    >
      {/* glow line top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: hover ? `linear-gradient(90deg, ${accent}, transparent)` : "transparent",
        transition: "background 0.3s",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div>
          <p style={{ ...F.sans, fontSize: 15, fontWeight: 600, color: T.textHi, marginBottom: 3 }}>{role}</p>
          <p style={{ ...F.mono, fontSize: 11, color: accent }}>@ {company}</p>
        </div>
        <span style={{ ...F.mono, fontSize: 10, color: T.textLo, paddingTop: 2 }}>{period}</span>
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ ...F.sans, fontSize: 13, color: T.textMid, display: "flex", gap: 10, lineHeight: 1.65 }}>
            <span style={{ color: accent, opacity: 0.5, flexShrink: 0, marginTop: 1 }}>▸</span>{b}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ──────────────────── PROJECT CARD ─────────────────────── */
function ProjectCard({ title, year, desc, link }: {
  title: string; year: string; desc: string; link: string;
}) {
  const [hover, setHover] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLAnchorElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current!.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <a
      ref={cardRef}
      href={link} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onMouseMove={onMouseMove}
      style={{
        display: "block", textDecoration: "none",
        background: T.bgCard,
        border: `1px solid ${hover ? T.borderHi : T.border}`,
        borderRadius: 16, padding: "24px 24px",
        position: "relative", overflow: "hidden",
        transition: "border-color 0.2s, transform 0.2s",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
      }}
    >
      {/* spotlight beam */}
      {hover && (
        <div style={{
          position: "absolute",
          left: mousePos.x - 80, top: mousePos.y - 80,
          width: 160, height: 160, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(100,210,255,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ ...F.mono, fontSize: 10, color: T.cyan, opacity: 0.6 }}>{year}</span>
        <ExternalLink size={13} color={T.textLo} />
      </div>
      <p style={{ ...F.serif, fontSize: 17, color: T.textHi, marginBottom: 10, lineHeight: 1.3 }}>{title}</p>
      <p style={{ ...F.sans, fontSize: 13, color: T.textMid, lineHeight: 1.7 }}>{desc}</p>
    </a>
  );
}

/* ──────────────────── CV DATA ───────────────────────────── */
const CV = {
  name:     "Hazem Alabiad",
  location: "Tübingen, Germany",
  email:    "hazem.alabiad@icloud.com",
  github:   "https://github.com/hazem-alabiad",
  linkedin: "https://linkedin.com/in/hazemalabiad",
  bio:      "I build software that understands language — and language systems that understand humans. 6+ years shipping production React/TypeScript at scale (IBM, Getir), now deep in LLMs and Computational Linguistics at Universität Tübingen. I sit at the intersection of clean engineering and cutting-edge NLP research.",
  badges:   ["TypeScript", "React", "Python", "NLP", "LLMs", "Node.js", "Arabic NLP"],
  skills: [
    { group: "Full-Stack",  items: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL", "Apollo Federation", "Redux", "WebSocket", "Elasticsearch"] },
    { group: "AI / NLP",   items: ["Python", "LLMs", "NLP", "TensorFlow", "Transfer Learning", "Pandas", "R", "Data Engineering", "LSTM", "CRF"] },
    { group: "DevOps",     items: ["Docker", "Git", "Linux", "Jest", "Cypress", "Playwright", "Puppeteer", "MySQL", "Agile"] },
  ],
  experience: [
    { role: "Research Assistant",               company: "Universität Tübingen",  period: "Jul 2026 – Now",       accent: T.cyan,   bullets: ["Building LLM-based AI tutor for university lectures"] },
    { role: "Research Assistant",               company: "IWM · Leibniz",         period: "Jul 2026 – Now",       accent: T.purple, bullets: ["Social media (TikTok) behavioral impact research"] },
    { role: "Software Engineer (Working Student)", company: "IBM · Böblingen",    period: "Jun 2024 – Apr 2026",  accent: T.cyan,   bullets: ["Production React UI for IBM Data Quality platform · 1M+ enterprise users", "300+ regression & E2E tests · Puppeteer + Cypress", "Led full a11y overhaul: ARIA, screen reader, keyboard nav"] },
    { role: "Frontend Developer",               company: "Getir · Ankara",        period: "Dec 2022 – Mar 2024",  accent: T.pink,   bullets: ["GetirJobs · 2.2M+ users · 2 greenfield React/TS projects", "3× dev-server speedup via Vite migration", "Raised test coverage to 70% · Playwright + Jest"] },
    { role: "Engineering Lead",                 company: "Arianna Suisse",        period: "Jun 2022 – Nov 2022",  accent: T.green,  bullets: ["Led 4 engineers · GraphQL API with Apollo Federation + MySQL", "Technical hiring across 50+ candidates"] },
    { role: "Full-Stack Developer",             company: "Arianna Suisse",        period: "May 2021 – Jun 2022",  accent: T.green,  bullets: ["GraphQL server · ~90% Jest coverage · custom Elasticsearch engine", "Real-time multi-user editing via WebSocket"] },
    { role: "Freelance Developer",              company: "Remote · US",           period: "Feb 2020 – Feb 2021",  accent: T.purple, bullets: ["React UIs for 3 international clients · Python crawlers → RabbitMQ → AI pipelines"] },
    { role: "QA Automation Engineer",           company: "Bayzat · UAE",          period: "Jan 2019 – Nov 2019",  accent: T.textMid,bullets: ["Built Cypress E2E suite from scratch; eliminated manual regression overhead"] },
  ],
  projects: [
    { title: "Multiword Expressions in Arabic", year: "2026", desc: "LLM-based extraction of Arabic verbal MWEs from large corpora — intersecting NLP and Arabic linguistics.",    link: "https://github.com/hazem-alabiad/MWE" },
    { title: "Content Rating System",           year: "2022", desc: "NLP/deep-learning classifier for age-appropriateness of books using transfer learning.",                       link: "https://github.com/hazem-alabiad/content-rating-system" },
    { title: "Taxi Tip Estimator",              year: "2021", desc: "ML/DL model trained on NYC trip data to predict gratuity amounts with high accuracy.",                         link: "https://github.com/hazem-alabiad/taxi-tip-estimator" },
    { title: "Automated Essay Grading",         year: "2019", desc: "LSTM pipeline for automated scoring of student essays — my first foray into NLP.",                            link: "https://github.com/hazem-alabiad/essay-grading" },
  ],
  education: [
    { degree: "M.A. Computational Linguistics", school: "Universität Tübingen",  period: "Oct 2023 – Present", tags: ["LLMs", "NLP", "Cognitive Science", "ML", "Corpus Linguistics"] },
    { degree: "B.Sc. Computer Engineering",     school: "Hacettepe University",  period: "Sep 2015 – Jun 2019", tags: ["Honor Student", "Top 10%", "GPA 3.41", "YTB Scholarship"] },
  ],
  languages: [
    { name: "Arabic",  level: "Native",     flag: "🇸🇦", pct: 100 },
    { name: "English", level: "Proficient", flag: "🇬🇧", pct: 92  },
    { name: "Turkish", level: "Proficient", flag: "🇹🇷", pct: 85  },
    { name: "German",  level: "Beginner",   flag: "🇩🇪", pct: 28  },
  ],
};

/* ──────────────────── MAIN APP ──────────────────────────── */
export default function AppNew() {
  const role = useTypewriter();
  const [active, setActive] = useState("about");

  useEffect(() => {
    document.title = `${CV.name} · Portfolio`;
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.3 }
    );
    document.querySelectorAll("section[id]").forEach(s => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  const wrap: React.CSSProperties = {
    maxWidth: 900, margin: "0 auto", padding: "0 32px",
    position: "relative", zIndex: 1,
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", color: T.textMid, overflowX: "hidden" }}>
      <MeshBackground />
      <Nav active={active} />

      {/* ── HERO ── */}
      <section id="about" style={{ ...wrap, paddingTop: 140, paddingBottom: 120 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            {/* status pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
              border: `1px solid ${T.green}44`, borderRadius: 20, padding: "5px 14px",
              background: `${T.green}0d` }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.green,
                boxShadow: `0 0 6px ${T.green}`, animation: "pulse 2s infinite" }} />
              <span style={{ ...F.mono, fontSize: 10, color: T.green, letterSpacing: ".12em" }}>OPEN TO OPPORTUNITIES</span>
            </div>

            {/* name */}
            <h1 style={{
              ...F.serif, fontSize: "clamp(3rem,7vw,5.2rem)",
              color: T.textHi, lineHeight: 1.0, marginBottom: 6,
              background: `linear-gradient(135deg, ${T.textHi} 40%, ${T.cyan})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Hazem Alabiad</h1>

            {/* typewriter */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, minHeight: 28 }}>
              <span style={{ ...F.mono, fontSize: 16, color: T.purple }}>~/</span>
              <span style={{ ...F.mono, fontSize: 16, color: T.cyan }}>{role}</span>
              <span style={{ ...F.mono, fontSize: 16, color: T.cyan,
                animation: "blink 1s step-end infinite" }}>▍</span>
            </div>

            <p style={{ ...F.sans, fontSize: 15.5, lineHeight: 1.9, color: "#a8b4cc", maxWidth: "54ch", marginBottom: 32 }}>
              {CV.bio}
            </p>

            {/* badges */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 36 }}>
              {CV.badges.map(b => (
                <span key={b} style={{ ...F.mono, fontSize: 11, padding: "4px 12px", borderRadius: 6,
                  border: `1px solid ${T.border}`, color: T.textMid, background: "rgba(255,255,255,0.03)" }}>{b}</span>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 32 }}>
              <a href={`mailto:${CV.email}`} style={{
                ...F.sans, display: "flex", alignItems: "center", gap: 8,
                padding: "11px 24px", borderRadius: 10, textDecoration: "none",
                background: `linear-gradient(135deg, ${T.cyan}, ${T.purple})`,
                color: T.bg, fontSize: 13, fontWeight: 700, letterSpacing: ".03em",
              }}><Mail size={13} /> Get in touch</a>
              <a
                href={resolveCvHref({ cvUrl: "", cvFileData: undefined, cvFileName: undefined }, cvAsset)}
                download={resolveCvName({ cvUrl: "", cvFileName: undefined }, "Hazem-Alabiad-CV.pdf")}
                style={{
                  ...F.sans, display: "flex", alignItems: "center", gap: 8,
                  padding: "11px 24px", borderRadius: 10, textDecoration: "none",
                  border: `1px solid ${T.border}`, color: T.textMid,
                  fontSize: 13, background: "transparent",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.borderHi; el.style.color = T.textHi; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.color = T.textMid; }}
              ><Download size={13} /> CV</a>
              <a href={CV.github} target="_blank" rel="noopener noreferrer" style={{
                ...F.sans, display: "flex", alignItems: "center", gap: 8,
                padding: "11px 20px", borderRadius: 10, textDecoration: "none",
                border: `1px solid ${T.border}`, color: T.textMid, fontSize: 13, background: "transparent",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = T.cyan; el.style.borderColor = T.cyan + "44"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = T.textMid; el.style.borderColor = T.border; }}
              ><Github size={13} /> GitHub</a>
              <a href={CV.linkedin} target="_blank" rel="noopener noreferrer" style={{
                ...F.sans, display: "flex", alignItems: "center", gap: 8,
                padding: "11px 20px", borderRadius: 10, textDecoration: "none",
                border: `1px solid ${T.border}`, color: T.textMid, fontSize: 13, background: "transparent",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.color = T.purple; el.style.borderColor = T.purple + "44"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.color = T.textMid; el.style.borderColor = T.border; }}
              ><Linkedin size={13} /> LinkedIn</a>
            </div>

            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textLo }}>
              <MapPin size={12} /> {CV.location}
            </span>
          </div>

          {/* Avatar col */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{
              position: "relative", width: 160, height: 160,
            }}>
              {/* glow ring */}
              <div style={{
                position: "absolute", inset: -4, borderRadius: "50%",
                background: `conic-gradient(${T.cyan}, ${T.purple}, ${T.pink}, ${T.cyan})`,
                animation: "spin 6s linear infinite",
              }} />
              <div style={{
                position: "absolute", inset: 2, borderRadius: "50%",
                overflow: "hidden", background: T.bg,
              }}>
                <img src={profilePhoto} alt="Hazem" style={{
                  width: "100%", height: "100%",
                  objectFit: "cover", objectPosition: "center 4%",
                  filter: "brightness(0.9) saturate(0.9)",
                }} />
              </div>
            </div>
            {/* language flags */}
            <div style={{ display: "flex", gap: 10 }}>
              {CV.languages.map(l => (
                <span key={l.name} title={`${l.name} — ${l.level}`} style={{ fontSize: 22, cursor: "default" }}>{l.flag}</span>
              ))}
            </div>
            {/* education compact */}
            <div style={{
              background: T.bgCard, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: "14px 18px", maxWidth: 220,
            }}>
              {CV.education.map(e => (
                <div key={e.degree} style={{ marginBottom: 10 }}>
                  <p style={{ ...F.sans, fontSize: 12, fontWeight: 600, color: T.textHi, lineHeight: 1.4 }}>{e.degree}</p>
                  <p style={{ ...F.mono, fontSize: 10, color: T.cyan, marginTop: 2 }}>{e.school}</p>
                  <p style={{ ...F.mono, fontSize: 9, color: T.textLo, marginTop: 1 }}>{e.period}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE ── */}
      <section id="experience" style={{ ...wrap, paddingBottom: 100, scrollMarginTop: 80 }}>
        <SLabel text="Experience" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CV.experience.map((exp, i) => (
            <ExpCard key={i} {...exp} />
          ))}
        </div>
      </section>

      {/* ── PROJECTS ── */}
      <section id="projects" style={{ ...wrap, paddingBottom: 100, scrollMarginTop: 80 }}>
        <SLabel text="Research & Projects" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {CV.projects.map(p => <ProjectCard key={p.title} {...p} />)}
        </div>
      </section>

      {/* ── SKILLS ── */}
      <section id="skills" style={{ ...wrap, paddingBottom: 120, scrollMarginTop: 80 }}>
        <SLabel text="Skills" />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {CV.skills.map(sg => (
            <div key={sg.group} style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div style={{ minWidth: 100 }}>
                <span style={{
                  ...F.mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase",
                  color: SKILL_COLORS[sg.group] ?? T.cyan,
                }}>{sg.group}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
                {sg.items.map(s => <SkillPill key={s} text={s} group={sg.group} />)}
              </div>
            </div>
          ))}
        </div>

        {/* Language bars */}
        <div style={{ marginTop: 56 }}>
          <SLabel text="Languages" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
            {CV.languages.map(l => (
              <div key={l.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ ...F.sans, fontSize: 13, color: T.textHi }}>{l.flag} {l.name}</span>
                  <span style={{ ...F.mono, fontSize: 10, color: T.textLo }}>{l.level}</span>
                </div>
                <div style={{ height: 4, background: T.bgCard, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${l.pct}%`, borderRadius: 4,
                    background: `linear-gradient(90deg, ${T.cyan}, ${T.purple})`,
                    transition: "width 1s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${T.border}`, textAlign: "center",
        padding: "28px 32px", position: "relative", zIndex: 1,
      }}>
        <p style={{ ...F.mono, fontSize: 11, color: T.textLo }}>
          © {new Date().getFullYear()} Hazem Alabiad &nbsp;·&nbsp; Built with React + Vite &nbsp;·&nbsp;
          <a href={CV.github} target="_blank" rel="noopener noreferrer" style={{ color: T.cyan, textDecoration: "none" }}>GitHub</a>
        </p>
      </footer>

      {/* keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;1,9..144,300&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.85)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #05070f; }
        ::-webkit-scrollbar-thumb { background: #1e2540; border-radius: 3px; }
        section[id] { scroll-margin-top: 80px; }
      `}</style>
    </div>
  );
}
