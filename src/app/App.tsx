import { useState, useEffect, useRef } from "react";
import {
  Github, Linkedin, Mail, MapPin,
  ArrowUpRight, Download, Settings,
  Code2, Brain, Cpu, Globe, Layers, Zap,
  GraduationCap, Briefcase, FlaskConical, Star,
  ChevronRight, Sparkles, Terminal, BookOpen,
} from "lucide-react";
import profilePhoto from "@/imports/IMG_0323.jpeg";
import cvAsset from "@/imports/Hazem-Alabiad-CV.pdf?url";
import { resolveCvHref, resolveCvName } from "./cv";
import CmsPage from "./components/CmsPage";

const OWNER = "hazem-alabiad";
const REPO = "hazem-alabiad.github.io";
const CONTENT_PATH = "src/app/content.json";
const TOKEN_KEY = "cms_gh_token";

/* ─── Types ─────────────────────────────────────────────── */
interface HeroContent {
  name: string; tagline: string; location: string; bio: string;
  researchFocus: string; email: string; phone: string;
  github: string; linkedin: string; cvUrl: string;
  cvFileData?: string; cvFileName?: string;
}
interface ExpItem { id: string; role: string; company: string; location: string; period: string; bullets: string[]; }
interface ProjItem { id: string; title: string; year: string; description: string; link: string; }
interface SkillGroup { id: string; label: string; skills: string; }
interface EduItem { id: string; degree: string; school: string; location: string; period: string; notes: string; }
interface LangItem { id: string; name: string; level: string; }
interface SiteContent {
  hero: HeroContent;
  experience: ExpItem[];
  projects: ProjItem[];
  skills: SkillGroup[];
  education: EduItem[];
  languages: LangItem[];
}

/* ─── Seed ───────────────────────────────────────────────── */
const seed: SiteContent = {
  hero: {
    name: "Hazem Alabiad",
    tagline: "Full-Stack Engineer · AI · NLP · LLM Research",
    location: "Tübingen, Germany",
    bio: "Software Engineer with 6+ years of experience building production-ready, maintainable systems and pixel-perfect UIs using React, Next.js, TypeScript, and modern tooling. Experienced in leading cross-functional teams, improving developer experience, and delivering design-driven applications at scale. Currently pursuing an M.A. in Computational Linguistics at the University of Tübingen and working as a Student Assistant at IWM & the Autonomous Learning Lab (Uni Tübingen), focusing on AI, ML, LLMs, NLP, and Cognitive Science — bridging software engineering and intelligent systems. Open to Working Student & internship roles in NLP, AI/ML, and LLMs — Tübingen, Stuttgart, or remote.",
    researchFocus: "Corpus Linguistics · Large Language Models · Cognitive Science · NLP",
    email: "hazem.alabiad@icloud.com",
    phone: "+49 157 544 46942",
    github: "github.com/hazem-alabiad",
    linkedin: "linkedin.com/in/hazemalabiad",
    cvUrl: "",
  },
  experience: [
    { id: "e1", role: "Research Assistant", company: "University of Tübingen", location: "Tübingen, Germany", period: "Jul 2026 – Present", bullets: ["LLM-based AI tutor for university lectures"] },
    { id: "e2", role: "Research Assistant", company: "Leibniz-Institut für Wissensmedien (IWM)", location: "Tübingen, Germany", period: "Jul 2026 – Present", bullets: ["Social media (TikTok) impact research"] },
    { id: "e3", role: "Software Engineer (Working Student)", company: "IBM", location: "Böblingen, Germany", period: "Jun 2024 – Apr 2026", bullets: ["Built production React UI for IBM's Data Quality platform serving 1M+ enterprise users using IBM Carbon and TypeScript", "Maintained 300+ regression and E2E tests with Puppeteer and Cypress", "Led accessibility improvements: ARIA, screen reader support, keyboard navigation"] },
    { id: "e4", role: "Frontend Developer", company: "Getir", location: "Ankara, Turkey", period: "Dec 2022 – Mar 2024", bullets: ["Maintained GetirJobs (2.2M+ users); led two greenfield React/TypeScript projects from scratch", "Boosted dev server speed 3× via Vite migration", "Raised component test coverage to 70% with Playwright and Jest"] },
    { id: "e5", role: "Engineering Lead", company: "Arianna Suisse Sa", location: "Remote · Switzerland", period: "Jun 2022 – Nov 2022", bullets: ["Led 4 engineers and 1 designer, delivering on time and within budget", "Architected scalable GraphQL API with Apollo Federation and MySQL", "Managed technical hiring for 50+ candidates; onboarded 4 team members"] },
    { id: "e6", role: "Full-Stack Developer", company: "Arianna Suisse Sa", location: "Remote · Switzerland", period: "May 2021 – Jun 2022", bullets: ["Built reusable React components; managed GraphQL server with Apollo Federation", "Custom Elasticsearch search engine and real-time multi-user editing via WebSocket"] },
    { id: "e7", role: "Freelance Software Developer", company: "Self-employed", location: "Remote · USA", period: "Feb 2020 – Feb 2021", bullets: ["Built pixel-perfect React UIs for 3 international clients", "Developed Python web crawlers publishing to RabbitMQ queues for backend AI pipelines"] },
    { id: "e8", role: "QA Automation Engineer", company: "Bayzat", location: "Remote · UAE", period: "Jan 2019 – Nov 2019", bullets: ["Built Cypress E2E suites from scratch, reducing manual testing overhead"] },
  ],
  projects: [
    { id: "p1", title: "Multiword Expressions in Arabic", year: "2026", description: "LLM-based extraction of Arabic verbal multiword expressions from large corpora.", link: "https://github.com/hazem-alabiad/MWE" },
    { id: "p2", title: "Content Rating System", year: "2022", description: "NLP/deep learning classifier for age-appropriateness of books.", link: "https://github.com/hazem-alabiad/content-rating-system" },
    { id: "p3", title: "Taxi Tip Estimator", year: "2021", description: "ML/DL predictor trained on NYC trip data to estimate gratuity amounts.", link: "https://github.com/hazem-alabiad/taxi-tip-estimator" },
    { id: "p4", title: "Automated Essay Grading", year: "2019", description: "LSTM-based pipeline for automated scoring of student essays.", link: "https://github.com/hazem-alabiad/essay-grading" },
  ],
  skills: [
    { id: "s1", label: "Full-Stack", skills: "React.js, Next.js, TypeScript, JavaScript (ES6+), Redux, GraphQL, Apollo Federation, Node.js, WebSocket, Elasticsearch" },
    { id: "s2", label: "AI / NLP", skills: "Python, LLMs, NLP, TensorFlow, Transfer Learning, Data Engineering, R, Pandas" },
    { id: "s3", label: "DevOps", skills: "Docker, Git, Jest, Cypress, Puppeteer, MySQL, Agile, Linux, Figma" },
  ],
  education: [
    { id: "d1", degree: "M.A. in Computational Linguistics", school: "Tübingen University", location: "Tübingen", period: "Oct 2023 – Present", notes: "Corpus Linguistics · LLMs · AI · Machine Learning · Cognitive Science · NLP" },
    { id: "d2", degree: "B.Sc. in Computer Engineering", school: "Hacettepe University", location: "Ankara", period: "Sep 2015 – Jun 2019", notes: "Honor Student · Top 10% · GPA 3.41 · YTB Scholarship" },
  ],
  languages: [
    { id: "l1", name: "Arabic", level: "Native" },
    { id: "l2", name: "English", level: "Proficient" },
    { id: "l3", name: "Turkish", level: "Proficient" },
    { id: "l4", name: "German", level: "Beginner" },
  ],
};

/* ─── Helpers ────────────────────────────────────────────── */
function groupByCompany(items: ExpItem[]) {
  const groups: { company: string; location: string; roles: ExpItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.company === item.company) { last.roles.push(item); }
    else { groups.push({ company: item.company, location: item.location, roles: [item] }); }
  }
  return groups;
}

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const DISPLAY: React.CSSProperties = { fontFamily: "'DM Serif Display', serif" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

// Neon palette
const N = {
  teal: "#2dd4bf",
  violet: "#a78bfa",
  cyan: "#67e8f9",
  pink: "#f472b6",
  bg: "#04040c",
  surface: "rgba(255,255,255,0.032)",
  border: "rgba(255,255,255,0.07)",
  text: "#e2e2f0",
  muted: "#6b6b8a",
};

/* ─── Animated Canvas Background ────────────────────────── */
function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let w = 0, h = 0;
    const NODES = 55;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    function resize() {
      w = canvas!.width = window.innerWidth;
      h = canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
    for (let i = 0; i < NODES; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.6,
      });
    }
    function draw() {
      ctx!.clearRect(0, 0, w, h);
      // subtle grid
      ctx!.strokeStyle = "rgba(45,212,191,0.025)";
      ctx!.lineWidth = 0.5;
      const GRID = 80;
      for (let x = 0; x < w; x += GRID) { ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, h); ctx!.stroke(); }
      for (let y = 0; y < h; y += GRID) { ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(w, y); ctx!.stroke(); }
      // connections
      for (let i = 0; i < NODES; i++) {
        for (let j = i + 1; j < NODES; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.18;
            ctx!.strokeStyle = `rgba(103,232,249,${alpha})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(nodes[i].x, nodes[i].y);
            ctx!.lineTo(nodes[j].x, nodes[j].y);
            ctx!.stroke();
          }
        }
      }
      // nodes
      nodes.forEach(n => {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(45,212,191,0.55)";
        ctx!.fill();
        // glow
        const grad = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6);
        grad.addColorStop(0, "rgba(45,212,191,0.12)");
        grad.addColorStop(1, "transparent");
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx!.fillStyle = grad;
        ctx!.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animId); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.7 }} />;
}

/* ─── Glassmorphism Card ─────────────────────────────────── */
function GlassCard({ children, className = "", style = {}, hover = true }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; hover?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={className}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.055)" : N.surface,
        border: `1px solid ${hovered ? "rgba(45,212,191,0.28)" : N.border}`,
        borderRadius: 16,
        backdropFilter: "blur(12px)",
        transition: "all 0.3s ease",
        boxShadow: hovered ? "0 0 32px rgba(45,212,191,0.06), inset 0 1px 0 rgba(255,255,255,0.06)" : "inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────── */
function SectionHeader({ label, id, icon }: { label: string; id: string; icon?: React.ReactNode }) {
  return (
    <div id={id} className="flex items-center gap-4 mb-14 scroll-mt-24">
      {icon && (
        <div style={{
          width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)", color: N.teal, flexShrink: 0,
        }}>{icon}</div>
      )}
      <span className="text-[11px] tracking-[0.3em] uppercase font-semibold" style={{ ...MONO, color: N.teal }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(45,212,191,0.3), transparent)" }} />
    </div>
  );
}

/* ─── Skill Icon Map ─────────────────────────────────────── */
const skillIcons: Record<string, string> = {
  "React.js": "⚛️", "Next.js": "▲", "TypeScript": "𝑻", "JavaScript (ES6+)": "𝐉",
  "Redux": "🔄", "GraphQL": "◆", "Node.js": "🟢", "WebSocket": "🔌",
  "Elasticsearch": "🔍", "Python": "🐍", "LLMs": "🤖", "NLP": "💬",
  "TensorFlow": "🧠", "Docker": "🐳", "Git": "📦", "Figma": "🎨",
  "Cypress": "🧪", "MySQL": "🗄️", "Linux": "🐧", "R": "📊",
};

const skillGroupIcons: Record<string, React.ReactNode> = {
  "Full-Stack": <Code2 size={16} />,
  "AI / NLP": <Brain size={16} />,
  "DevOps": <Cpu size={16} />,
};

/* ─── Main App ───────────────────────────────────────────── */
export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [data, setData] = useState<SiteContent>(seed);
  const [activeSection, setActiveSection] = useState("education");

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) { setOwnerChecked(true); return; }
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${stored}`, Accept: "application/vnd.github+json" },
    })
      .then(r => r.json())
      .then(u => { if (u.login === OWNER) setIsOwner(true); })
      .catch(() => {})
      .finally(() => setOwnerChecked(true));
  }, []);

  useEffect(() => {
    fetch(`https://raw.githubusercontent.com/${OWNER}/${REPO}/main/${CONTENT_PATH}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!ownerChecked) return;
    const base = "https://countapi.mileshilliard.com";
    const key = "hazem-alabiad_portfolio";
    const endpoint = isOwner ? `${base}/api/v1/get/${key}` : `${base}/api/v1/hit/${key}`;
    fetch(endpoint)
      .then(r => r.json())
      .then(d => { if (d.value !== undefined) setVisitCount(Number(d.value)); })
      .catch(() => {});
  }, [ownerChecked, isOwner]);

  useEffect(() => {
    const title = `${data.hero.name} • Portfolio`;
    document.title = title;
    const desc = data.hero.bio.slice(0, 155) + (data.hero.bio.length > 155 ? "…" : "");
    document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", desc);
  }, [data.hero]);

  // Scroll spy
  useEffect(() => {
    const sections = ["education", "experience", "projects", "skills"];
    const handler = () => {
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) { setActiveSection(id); break; }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (hash === "#/cms") return <CmsPage onExit={() => { window.location.hash = ""; setHash(""); }} />;

  const { hero, experience, projects, skills, education, languages } = data;
  const currentYear = new Date().getFullYear();
  const navLinks: [string, string][] = [["Education", "education"], ["Experience", "experience"], ["Research", "projects"], ["Skills", "skills"]];

  return (
    <div className="min-h-screen antialiased" style={{ background: N.bg, color: N.text, position: "relative" }}>

      {/* Animated background */}
      <NeuralBackground />

      {/* Ambient blobs */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-15%", left: "-10%", width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)", animation: "pulse 8s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "40%", right: "-15%", width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)", animation: "pulse 10s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "30%", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,114,182,0.04) 0%, transparent 70%)", animation: "pulse 12s ease-in-out infinite 4s" }} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .fade-up { animation: fadeInUp 0.7s ease forwards; }
        .slide-right { animation: slideRight 0.5s ease forwards; }
        .name-shimmer {
          background: linear-gradient(135deg, #e2e2f0 0%, #2dd4bf 40%, #a78bfa 60%, #e2e2f0 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 6s linear infinite;
        }
        .float-avatar { animation: float 6s ease-in-out infinite; }
        .nav-pill {
          transition: all 0.25s ease;
        }
        .nav-pill:hover, .nav-pill.active {
          background: rgba(45,212,191,0.12) !important;
          color: #2dd4bf !important;
          border-color: rgba(45,212,191,0.3) !important;
        }
        .skill-tag {
          transition: all 0.2s ease;
          cursor: default;
        }
        .skill-tag:hover {
          background: rgba(45,212,191,0.12) !important;
          border-color: rgba(45,212,191,0.35) !important;
          color: #2dd4bf !important;
          transform: translateY(-2px);
        }
        .proj-card {
          transition: all 0.3s ease;
        }
        .proj-card:hover {
          transform: translateY(-4px);
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 64,
        background: "rgba(4,4,12,0.8)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 1px 0 rgba(45,212,191,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "rgba(45,212,191,0.12)",
            border: "1px solid rgba(45,212,191,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Terminal size={14} style={{ color: N.teal }} />
          </div>
          <span style={{ ...MONO, color: N.teal, fontSize: 14, fontWeight: 600 }}>{hero.name.split(" ")[0]}<span style={{ color: N.muted }}>.</span><span style={{ color: N.violet }}>dev</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {navLinks.map(([label, id]) => (
            <a key={id} href={`#${id}`}
              className={`nav-pill ${activeSection === id ? "active" : ""}`}
              style={{
                ...MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em",
                padding: "5px 14px", borderRadius: 8, border: "1px solid transparent",
                color: activeSection === id ? N.teal : N.muted,
                background: activeSection === id ? "rgba(45,212,191,0.1)" : "transparent",
                borderColor: activeSection === id ? "rgba(45,212,191,0.25)" : "transparent",
                textDecoration: "none",
              }}>{label}</a>
          ))}
        </div>
        <a href={`mailto:${hero.email}`}
          style={{ ...MONO, fontSize: 12, color: N.teal, textDecoration: "none", opacity: 0.8 }}>
          {hero.email}
        </a>
      </nav>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem", paddingTop: 100, paddingBottom: 120, position: "relative", zIndex: 1 }}>

        {/* ── Hero ─────────────────────────────────────── */}
        <section style={{ marginBottom: 120 }} className="fade-up">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start", justifyContent: "space-between" }}>

            {/* Left */}
            <div style={{ flex: "1 1 420px", minWidth: 0 }}>
              {/* Status badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
                borderRadius: 100, background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)",
                marginBottom: 28,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: N.teal, boxShadow: `0 0 8px ${N.teal}`, display: "inline-block" }} />
                <span style={{ ...MONO, fontSize: 11, color: N.teal, letterSpacing: "0.2em", textTransform: "uppercase" }}>Available for opportunities</span>
              </div>

              {/* Name */}
              <h1 className="name-shimmer" style={{ ...DISPLAY, fontSize: "clamp(2.8rem,7vw,4.8rem)", lineHeight: 1, marginBottom: 20, letterSpacing: "-0.02em" }}>
                {hero.name}
              </h1>

              {/* Tagline */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <Sparkles size={14} style={{ color: N.violet, flexShrink: 0 }} />
                <p style={{ ...MONO, fontSize: 13, color: N.violet, letterSpacing: "0.04em" }}>{hero.tagline}</p>
              </div>

              {/* Skill badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 }}>
                {["TypeScript", "React", "Node.js", "Python", "NLP", "LLMs"].map(skill => (
                  <span key={skill} className="skill-tag" style={{
                    ...MONO, fontSize: 11, padding: "5px 12px", borderRadius: 8,
                    background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)", color: N.teal,
                  }}>
                    {skillIcons[skill] && <span style={{ marginRight: 4 }}>{skillIcons[skill]}</span>}{skill}
                  </span>
                ))}
              </div>

              {/* Bio */}
              <div style={{ marginBottom: 32, maxWidth: "54ch" }}>
                {hero.bio.split("\n\n").map((para, i) => (
                  <p key={i} style={{ ...SANS, fontSize: 16, lineHeight: 1.85, color: "#c0c0d8", marginBottom: 12 }}>{para}</p>
                ))}
              </div>

              {/* Research focus */}
              {hero.researchFocus && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
                  borderRadius: 10, background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.15)",
                  marginBottom: 28,
                }}>
                  <BookOpen size={14} style={{ color: N.violet, marginTop: 2, flexShrink: 0 }} />
                  <p style={{ ...MONO, fontSize: 11, color: N.violet, lineHeight: 1.7, letterSpacing: "0.03em" }}>{hero.researchFocus}</p>
                </div>
              )}

              {/* CTAs */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
                <a href={`mailto:${hero.email}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  background: `linear-gradient(135deg, ${N.teal}, #0d9488)`,
                  color: "#04040c", textDecoration: "none", boxShadow: `0 0 20px rgba(45,212,191,0.25)`,
                  transition: "all 0.2s ease",
                }}>
                  <Mail size={15} /> Get in touch
                </a>
                <a href={resolveCvHref(hero, cvAsset)} download={resolveCvName(hero, "Hazem-Alabiad-CV.pdf")} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 22px", borderRadius: 10, fontSize: 14,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                  color: N.text, textDecoration: "none", transition: "all 0.2s ease",
                }}>
                  <Download size={15} /> Download CV
                </a>
              </div>

              {/* Socials */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {[
                  { href: `https://${hero.github}`, icon: <Github size={15} />, label: "GitHub" },
                  { href: `https://${hero.linkedin}`, icon: <Linkedin size={15} />, label: "LinkedIn" },
                ].map(link => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
                    color: N.muted, textDecoration: "none", transition: "color 0.2s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = N.teal}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = N.muted}
                  >
                    {link.icon} {link.label}
                  </a>
                ))}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: N.muted }}>
                  <MapPin size={14} /> {hero.location}
                </span>
              </div>
            </div>

            {/* Right — avatar */}
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div className="float-avatar" style={{
                width: 176, height: 176, borderRadius: "50%", overflow: "hidden", position: "relative",
                boxShadow: `0 0 0 2px rgba(45,212,191,0.4), 0 0 60px rgba(45,212,191,0.12)`,
                background: "#0d1117",
              }}>
                <img src={profilePhoto} alt={hero.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 4%", filter: "brightness(0.93) contrast(1.05)" }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle at center, transparent 55%, rgba(4,4,12,0.4) 100%)" }} />
              </div>
              {/* Stats pills */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
                {[
                  { icon: <Briefcase size={12} />, text: "6+ yrs exp" },
                  { icon: <GraduationCap size={12} />, text: "M.A. Comp. Ling." },
                  { icon: <Globe size={12} />, text: "4 languages" },
                ].map(stat => (
                  <div key={stat.text} style={{
                    display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 8,
                    background: N.surface, border: `1px solid ${N.border}`, fontSize: 11,
                    color: N.muted, ...MONO,
                  }}>
                    <span style={{ color: N.teal }}>{stat.icon}</span> {stat.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Education ────────────────────────────────── */}
        <section style={{ marginBottom: 100 }}>
          <SectionHeader label="Education" id="education" icon={<GraduationCap size={16} />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {education.map((edu, i) => (
              <GlassCard key={edu.id} style={{ padding: "24px 28px", animationDelay: `${i * 0.1}s` }}>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <h3 style={{ ...SANS, fontSize: 16, fontWeight: 600, color: "#eeeef5", marginBottom: 4 }}>{edu.degree}</h3>
                    <p style={{ fontSize: 14, marginBottom: 8 }}>
                      <span style={{ color: N.teal }}>{edu.school}</span>
                      <span style={{ color: N.muted }}> · {edu.location}</span>
                    </p>
                    {edu.notes && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Star size={11} style={{ color: N.violet, flexShrink: 0 }} />
                        <p style={{ ...MONO, fontSize: 11, color: "#8080a8", lineHeight: 1.6 }}>{edu.notes}</p>
                      </div>
                    )}
                  </div>
                  <span style={{ ...MONO, fontSize: 11, color: N.muted, whiteSpace: "nowrap",
                    padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${N.border}`,
                  }}>{edu.period}</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Experience ───────────────────────────────── */}
        <section style={{ marginBottom: 100 }}>
          <SectionHeader label="Experience" id="experience" icon={<Briefcase size={16} />} />
          <div style={{ position: "relative" }}>
            {groupByCompany(experience).map((group, gi, arr) => (
              <div key={group.company + gi} style={{ position: "relative", paddingLeft: 28, paddingBottom: gi < arr.length - 1 ? 32 : 0 }}>
                {/* Timeline dot */}
                <div style={{
                  position: "absolute", left: 0, top: 10, width: 10, height: 10, borderRadius: "50%",
                  background: N.teal, boxShadow: `0 0 10px ${N.teal}`, opacity: 0.7,
                }} />
                {/* Timeline line */}
                {gi < arr.length - 1 && (
                  <div style={{
                    position: "absolute", left: 4, top: 24, bottom: 0, width: 2,
                    background: `linear-gradient(180deg, rgba(45,212,191,0.25), transparent)`,
                  }} />
                )}
                <GlassCard style={{ padding: "20px 24px" }}>
                  {group.roles.length === 1 ? (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                        <div>
                          <h3 style={{ ...SANS, fontSize: 15, fontWeight: 600, color: "#eeeef5", marginBottom: 3 }}>{group.roles[0].role}</h3>
                          <p style={{ fontSize: 13 }}>
                            <span style={{ color: N.teal }}>{group.company}</span>
                            <span style={{ color: N.muted }}> · {group.location}</span>
                          </p>
                        </div>
                        <span style={{ ...MONO, fontSize: 11, color: N.muted, whiteSpace: "nowrap",
                          padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: `1px solid ${N.border}`,
                        }}>{group.roles[0].period}</span>
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                        {group.roles[0].bullets.filter(Boolean).map((b, bi) => (
                          <li key={bi} style={{ display: "flex", gap: 10, fontSize: 14, color: "#ababc0", lineHeight: 1.6 }}>
                            <ChevronRight size={14} style={{ color: N.teal, opacity: 0.5, marginTop: 2, flexShrink: 0 }} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <h3 style={{ ...SANS, fontSize: 15, fontWeight: 700, color: N.teal, marginBottom: 2 }}>{group.company}</h3>
                        <p style={{ fontSize: 13, color: N.muted }}>{group.location}</p>
                      </div>
                      <div style={{ borderLeft: `2px solid rgba(45,212,191,0.15)`, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                        {group.roles.map(role => (
                          <div key={role.id}>
                            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                              <span style={{ ...SANS, fontSize: 14, fontWeight: 500, color: "#d8d8ec" }}>{role.role}</span>
                              <span style={{ ...MONO, fontSize: 11, color: N.muted }}>{role.period}</span>
                            </div>
                            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                              {role.bullets.filter(Boolean).map((b, bi) => (
                                <li key={bi} style={{ display: "flex", gap: 10, fontSize: 13, color: "#ababc0", lineHeight: 1.6 }}>
                                  <ChevronRight size={13} style={{ color: N.teal, opacity: 0.4, marginTop: 2, flexShrink: 0 }} />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </GlassCard>
              </div>
            ))}
          </div>
        </section>

        {/* ── Projects ─────────────────────────────────── */}
        <section style={{ marginBottom: 100 }}>
          <SectionHeader label="Research & Projects" id="projects" icon={<FlaskConical size={16} />} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {projects.map((proj, i) => (
              <a key={proj.id} href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                target="_blank" rel="noopener noreferrer" className="proj-card"
                style={{ textDecoration: "none", display: "block" }}
              >
                <GlassCard style={{ padding: "22px 22px", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `rgba(${i % 2 === 0 ? "45,212,191" : "167,139,250"},0.12)`,
                      border: `1px solid rgba(${i % 2 === 0 ? "45,212,191" : "167,139,250"},0.2)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: i % 2 === 0 ? N.teal : N.violet,
                    }}>
                      {i % 3 === 0 ? <Brain size={16} /> : i % 3 === 1 ? <Layers size={16} /> : <Zap size={16} />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ ...MONO, fontSize: 11, color: N.muted }}>{proj.year}</span>
                      <ArrowUpRight size={13} style={{ color: N.muted }} />
                    </div>
                  </div>
                  <h3 style={{ ...SANS, fontSize: 15, fontWeight: 600, color: "#eeeef5", marginBottom: 8, lineHeight: 1.3 }}>{proj.title}</h3>
                  <p style={{ fontSize: 13, color: "#8f8fa8", lineHeight: 1.6 }}>{proj.description}</p>
                </GlassCard>
              </a>
            ))}
          </div>
        </section>

        {/* ── Skills ───────────────────────────────────── */}
        <section style={{ marginBottom: 100 }}>
          <SectionHeader label="Skills" id="skills" icon={<Code2 size={16} />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {skills.map(sg => (
              <GlassCard key={sg.id} style={{ padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.18)", color: N.teal,
                  }}>{skillGroupIcons[sg.label] ?? <Star size={14} />}</div>
                  <span style={{ ...MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.22em", color: N.teal }}>{sg.label}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {sg.skills.split(",").map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="skill-tag" style={{
                      ...MONO, fontSize: 12, padding: "6px 12px", borderRadius: 8,
                      background: "rgba(255,255,255,0.03)", border: `1px solid ${N.border}`, color: "#a0a0b8",
                    }}>
                      {skillIcons[skill] && <span style={{ marginRight: 5 }}>{skillIcons[skill]}</span>}{skill}
                    </span>
                  ))}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* ── Languages ────────────────────────────────── */}
        {languages.length > 0 && (
          <section style={{ marginBottom: 80 }}>
            <SectionHeader label="Languages" id="languages" icon={<Globe size={16} />} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {languages.map(lang => (
                <GlassCard key={lang.id} style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ ...SANS, fontSize: 15, fontWeight: 500, color: "#eeeef5" }}>{lang.name}</span>
                  <span style={{
                    ...MONO, fontSize: 11, padding: "3px 10px", borderRadius: 20,
                    background: "rgba(45,212,191,0.08)", color: N.teal, border: "1px solid rgba(45,212,191,0.18)",
                  }}>{lang.level}</span>
                </GlassCard>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 1, borderTop: `1px solid ${N.border}`,
        padding: "28px 2rem",
      }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
          <p style={{ ...MONO, fontSize: 12, color: N.muted }}>© {currentYear} {hero.name}</p>
          {visitCount !== null && (
            <span style={{ ...MONO, fontSize: 12, color: "#4a4a60", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: N.teal, opacity: 0.5, display: "inline-block" }} />
              {visitCount.toLocaleString()} visits
            </span>
          )}
        </div>
      </footer>

      {/* CMS button — preserved */}
      <button
        onClick={() => { window.location.hash = "#/cms"; setHash("#/cms"); }}
        title="Open CMS"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9998,
          width: 44, height: 44, borderRadius: "50%",
          background: "rgba(4,4,12,0.9)",
          border: "1px solid rgba(45,212,191,0.4)",
          color: N.teal, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.6), 0 0 12px rgba(45,212,191,0.1)",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(45,212,191,0.12)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 24px rgba(0,0,0,0.6), 0 0 20px rgba(45,212,191,0.2)`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(4,4,12,0.9)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(0,0,0,0.6), 0 0 12px rgba(45,212,191,0.1)"; }}
      >
        <Settings size={18} />
      </button>
    </div>
  );
}
