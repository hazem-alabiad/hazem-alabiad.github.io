import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import {
  Github, Linkedin, Mail, MapPin,
  ArrowUpRight, Download, Settings,
  Code2, Brain, Cpu, Globe, Layers, Zap,
  GraduationCap, Briefcase, FlaskConical, Star,
  ChevronRight, Sparkles, Terminal as TerminalIcon, BookOpen,
  Menu, X, Sun, Moon, Monitor,
} from "lucide-react";
import profilePhoto from "@/imports/IMG_0323.jpeg";
import cvAsset from "@/imports/Hazem-Alabiad-CV.pdf?url";
import { resolveCvHref, resolveCvName } from "./cv";
import CmsPage from "./components/CmsPage";
import NeuralBackground from "./components/NeuralBackground";
import GlitchOverlay from "./components/GlitchOverlay";
import { ThemeToggle } from "./components/ThemeToggle";
import { GlassCard } from "./components/GlassCard";
import { SectionHeader } from "./components/SectionHeader";
import Terminal from "./components/Terminal";

const OWNER = "hazem-alabiad";
const REPO = "hazem-alabiad.github.io";
const CONTENT_PATH = "src/app/content.json";
const TOKEN_KEY = "cms_gh_token";

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
    { id: "p1", title: "Multiword Expressions in Arabic", year: "2026", description: "LLM-based extraction of Arabic verbal multiword expressions from large corpora.", link: "https://github.com/hazem-alabiad/MWE", tags: ["Python", "LLMs", "NLP"] },
    { id: "p2", title: "Content Rating System", year: "2022", description: "NLP/deep learning classifier for age-appropriateness of books.", link: "https://github.com/hazem-alabiad/content-rating-system", tags: ["Python", "TensorFlow", "NLP"] },
    { id: "p3", title: "Taxi Tip Estimator", year: "2021", description: "ML/DL predictor trained on NYC trip data to estimate gratuity amounts.", link: "https://github.com/hazem-alabiad/taxi-tip-estimator", tags: ["Python", "ML", "Pandas"] },
    { id: "p4", title: "Automated Essay Grading", year: "2019", description: "LSTM-based pipeline for automated scoring of student essays.", link: "https://github.com/hazem-alabiad/essay-grading", tags: ["Python", "LSTM", "NLP"] },
  ],
  skills: [
    { id: "s1", label: "Full-Stack", skills: "React.js, Next.js, TypeScript, JavaScript (ES6+), Redux, GraphQL, Apollo Federation, Node.js, WebSocket, Elasticsearch", level: 90 },
    { id: "s2", label: "AI / NLP", skills: "Python, LLMs, NLP, TensorFlow, Transfer Learning, Data Engineering, R, Pandas", level: 75 },
    { id: "s3", label: "DevOps", skills: "Docker, Git, Jest, Cypress, Puppeteer, MySQL, Agile, Linux, Figma", level: 70 },
  ],
  education: [
    { id: "d1", degree: "M.A. in Computational Linguistics", school: "Tübingen University", location: "Tübingen", period: "Oct 2023 – Present", notes: "Corpus Linguistics · LLMs · AI · Machine Learning · Cognitive Science · NLP" },
    { id: "d2", degree: "B.Sc. in Computer Engineering", school: "Hacettepe University", location: "Ankara", period: "Sep 2015 – Jun 2019", notes: "Honor Student · Top 10% · GPA 3.41 · YTB Scholarship" },
  ],
  languages: [
    { id: "l1", name: "Arabic", level: "Native", pct: 100 },
    { id: "l2", name: "English", level: "Proficient", pct: 85 },
    { id: "l3", name: "Turkish", level: "Proficient", pct: 75 },
    { id: "l4", name: "German", level: "Beginner", pct: 20 },
  ],
};

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

const N = {
  teal: "#2dd4bf",
  tealDark: "#0d9488",
  violet: "#a78bfa",
  violetDark: "#7c3aed",
  cyan: "#67e8f9",
  pink: "#f472b6",
  bg: "#05050e",
  text: "#e0e0ec",
  textSoft: "#c0c0d8",
  muted: "#7a7a9a",
  border: "rgba(255,255,255,0.06)",
  borderHover: "rgba(45,212,191,0.25)",
};

const L = {
  bg: "#fbfbff",
  text: "#111",
  muted: "#666",
  card: "#fff",
  border: "#e4e4e7",
  teal: "#0d9488",
  violet: "#7c3aed",
};

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

function StatCounter({ icon, label, target, delay, isDark, mutedColor }: { icon: React.ReactNode; label: string; target: number; delay: number; isDark: boolean; mutedColor: string }) {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setVisible(true); }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      let start = 0;
      const duration = 1200;
      const startTime = performance.now();
      function step(now: number) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [visible, target, delay]);

  return (
    <div ref={ref} className="stat-counter" style={{
      display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 10,
      background: isDark ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.03)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`, fontSize: 12.5,
      color: mutedColor, ...MONO,
    }}>
      <span style={{ color: N.teal }}>{icon}</span> {count}{label.includes("yrs") ? "+" : ""}{label.includes("M") ? "." : ""}{label.includes("langs") ? "" : ""}
    </div>
  );
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [data, setData] = useState<SiteContent>(seed);
  const [activeSection, setActiveSection] = useState("education");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [typedTagline, setTypedTagline] = useState("");
  const [taglineIdx, setTaglineIdx] = useState(0);
  const fullTagline = data.hero.tagline;

  useEffect(() => {
    if (taglineIdx < fullTagline.length) {
      const t = setTimeout(() => setTaglineIdx(i => i + 1), 40);
      return () => clearTimeout(t);
    }
  }, [taglineIdx, fullTagline]);

  useEffect(() => {
    setTypedTagline(fullTagline.slice(0, taglineIdx));
  }, [taglineIdx, fullTagline]);

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

  useEffect(() => {
    const sections = ["education", "experience", "projects", "skills"];
    const handler = () => {
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 120) { setActiveSection(id); break; }
      }
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      const bar = document.getElementById("scroll-progress");
      if (bar) bar.style.width = `${pct}%`;
    };
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (hash === "#/cms") return <CmsPage onExit={() => { window.location.hash = ""; setHash(""); }} />;

  const { hero, experience, projects, skills, education, languages } = data;
  const currentYear = new Date().getFullYear();
  const navLinks: [string, string][] = [["Education", "education"], ["Experience", "experience"], ["Research", "projects"], ["Skills", "skills"]];
  const heroSkills = ["TypeScript", "React", "Node.js", "Python", "NLP", "LLMs"];
  const isDark = document.documentElement.classList.contains("dark") || (!document.documentElement.classList.contains("light") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const accent = isDark ? N.teal : L.teal;
  const bgColor = isDark ? N.bg : L.bg;
  const textColor = isDark ? N.text : L.text;
  const mutedColor = isDark ? N.muted : L.muted;

  return (
    <div className="min-h-screen antialiased" style={{ background: bgColor, color: textColor, position: "relative" }}>

      <NeuralBackground />
      <GlitchOverlay />
      <div className="noise-overlay" />

      <style>{`
        @keyframes termBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes blobPulse { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.08)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInLeft { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeInRight { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes scan { 0%{transform:translateY(-100%)} 100%{transform:translateY(200%)} }
        @keyframes ringFill { from{stroke-dashoffset:251} }
        @keyframes hexPulse { 0%,100%{filter:drop-shadow(0 0 8px rgba(45,212,191,0.3))} 50%{filter:drop-shadow(0 0 20px rgba(45,212,191,0.6))} }
        @keyframes glitch { 0%,100%{transform:translate(0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(2px,-1px)} 60%{transform:translate(-1px,2px)} 80%{transform:translate(1px,-2px)} }
        @keyframes ringRotate { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes typewriter { from{width:0} to{width:100%} }
        @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(45,212,191,0.1)} 50%{box-shadow:0 0 40px rgba(45,212,191,0.25)} }
        @keyframes slideInUp { from{opacity:0;transform:translateY(40px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes slideInLeft { from{opacity:0;transform:translateX(-40px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(40px) scale(0.97)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(45,212,191,0.1)} 50%{box-shadow:0 0 40px rgba(45,212,191,0.25)} }
        @keyframes borderGlow { 0%,100%{border-color:rgba(45,212,191,0.15)} 50%{border-color:rgba(45,212,191,0.35)} }
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .fade-up { animation: fadeInUp 0.7s ease forwards; }
        .name-shimmer {
          background: linear-gradient(135deg, #e2e2f0 0%, #2dd4bf 30%, #a78bfa 60%, #67e8f9 80%, #e2e2f0 100%);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }
        .float-avatar { animation: float 6s ease-in-out infinite; }
        .nav-pill { transition: all 0.25s ease; }
        .nav-pill:hover, .nav-pill.active {
          background: rgba(45,212,191,0.12) !important;
          color: #2dd4bf !important;
          border-color: rgba(45,212,191,0.3) !important;
        }
        .skill-tag { transition: all 0.25s cubic-bezier(0.16,1,0.3,1); cursor: default; }
        .skill-tag:hover {
          background: rgba(45,212,191,0.12) !important;
          border-color: rgba(45,212,191,0.35) !important;
          color: #2dd4bf !important;
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 4px 12px rgba(45,212,191,0.1);
        }
        .proj-card { transition: all 0.35s cubic-bezier(0.16,1,0.3,1); }
        .proj-card:hover { transform: translateY(-6px) scale(1.01); }
        .scanline {
          background: linear-gradient(180deg, transparent, rgba(45,212,191,0.06), transparent);
          animation: scan 5s linear infinite;
        }
        .hex-avatar { clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%); animation: hexPulse 4s ease-in-out infinite; }
        .avatar-ring {
          background: conic-gradient(from 0deg, #2dd4bf, #a78bfa, #67e8f9, #2dd4bf);
          animation: ringRotate 6s linear infinite;
        }
        .stat-counter { animation: countUp 0.6s ease forwards; }
        .glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
        .glass-hover { transition: all 0.35s cubic-bezier(0.16,1,0.3,1); }
        .glass-hover:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(45,212,191,0.1); }
        .tagline-cursor { display: inline-block; width: 2px; height: 1em; background: #a78bfa; margin-left: 2px; animation: blink 1s steps(2) infinite; vertical-align: text-bottom; }
        .mobile-nav { transform: translateX(100%); transition: transform 0.35s cubic-bezier(0.16,1,0.3,1); }
        .mobile-nav.open { transform: translateX(0); }
        .mobile-overlay { opacity: 0; pointer-events: none; transition: opacity 0.35s ease; }
        .mobile-overlay.open { opacity: 1; pointer-events: auto; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(45,212,191,0.3); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(45,212,191,0.5); }
        * { scrollbar-width: thin; scrollbar-color: rgba(45,212,191,0.3) transparent; }
        .noise-overlay {
          position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat;
          background-size: 256px 256px;
        }
        .scroll-progress {
          position: fixed; top: 0; left: 0; height: 2px; z-index: 9999;
          background: linear-gradient(90deg, #5eead4, #a78bfa, #67e8f9);
          transition: width 0.1s ease;
          border-radius: 0 2px 2px 0;
        }
        .hero-grid { transition: all 0.5s ease; }
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .nav-pills { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="scroll-progress" id="scroll-progress" />

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 2rem", height: 64,
        background: "rgba(8,8,14,0.85)",
        backdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 1px 0 rgba(45,212,191,0.08)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: "rgba(45,212,191,0.12)",
            border: "1px solid rgba(45,212,191,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <TerminalIcon size={14} style={{ color: N.teal }} />
          </div>
          <span style={{ ...MONO, color: N.teal, fontSize: 14, fontWeight: 600 }}>{hero.name.split(" ")[0]}<span style={{ color: N.muted }}>.</span><span style={{ color: N.violet }}>dev</span></span>
        </div>
        <div className="nav-pills" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {navLinks.map(([label, id]) => (
            <a key={id} href={`#${id}`}
              className={`nav-pill ${activeSection === id ? "active" : ""}`}
              style={{
                ...MONO, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.18em",
                padding: "5px 14px", borderRadius: 8, border: "1px solid transparent",
                color: activeSection === id ? N.teal : N.muted,
                background: activeSection === id ? "rgba(45,212,191,0.1)" : "transparent",
                borderColor: activeSection === id ? "rgba(45,212,191,0.25)" : "transparent",
                textDecoration: "none",
              }}>{label}</a>
          ))}
          <ThemeToggle />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a href={`mailto:${hero.email}`}
            style={{ ...MONO, fontSize: 13, color: N.teal, textDecoration: "none", opacity: 0.8 }}>
            {hero.email}
          </a>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}
            style={{ display: "none", alignItems: "center", justifyContent: "center", background: "none", border: "none", color: N.teal, cursor: "pointer" }}>
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile nav overlay */}
      <div className={`mobile-overlay ${mobileMenuOpen ? "open" : ""}`}
        style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(4,4,12,0.9)", backdropFilter: "blur(12px)" }}
        onClick={() => setMobileMenuOpen(false)}>
        <div className="mobile-nav open" style={{
          position: "fixed", right: 0, top: 0, bottom: 0, width: 280,
          background: "#0a0a14", borderLeft: "1px solid rgba(45,212,191,0.15)",
          padding: "80px 24px", display: "flex", flexDirection: "column", gap: 16,
        }}>
          <button onClick={() => setMobileMenuOpen(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: N.muted, cursor: "pointer" }}>
            <X size={20} />
          </button>
          {navLinks.map(([label, id]) => (
            <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)}
              style={{ ...MONO, fontSize: 13, color: N.muted, textDecoration: "none", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              {label}
            </a>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "0 2rem", paddingTop: 100, paddingBottom: 120, position: "relative", zIndex: 1 }}>

        {/* ── Hero ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{ marginBottom: 140 }}
        >
          <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 56, alignItems: "start" }}>
            {/* Left column */}
            <motion.div style={{ minWidth: 0 }}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px",
                  borderRadius: 100, background: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)",
                  marginBottom: 28,
                }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: N.teal, boxShadow: `0 0 8px ${N.teal}`, display: "inline-block" }} />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{ ...MONO, fontSize: 13, color: N.teal, letterSpacing: "0.2em", textTransform: "uppercase" }}>Available for opportunities</motion.span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="name-shimmer"
                style={{ ...DISPLAY, fontSize: "clamp(3rem,7vw,5.2rem)", lineHeight: 1.05, marginBottom: 24, letterSpacing: "-0.03em" }}>
                {hero.name}
              </motion.h1>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <Sparkles size={16} style={{ color: N.violet, flexShrink: 0 }} />
                <p style={{ ...MONO, fontSize: 14, color: N.violet, letterSpacing: "0.04em", margin: 0 }}>
                  {typedTagline}<span className="tagline-cursor" />
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
                {heroSkills.map(skill => (
                  <span key={skill} className="skill-tag" style={{
                    ...MONO, fontSize: 12, padding: "6px 14px", borderRadius: 8,
                    background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)", color: N.teal,
                  }}>
                    {skillIcons[skill] && <span style={{ marginRight: 5 }}>{skillIcons[skill]}</span>}{skill}
                  </span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                style={{ marginBottom: 36, maxWidth: "60ch" }}>
                {hero.bio.split("\n\n").map((para, i) => (
                  <p key={i} style={{ ...SANS, fontSize: 16, lineHeight: 1.85, color: isDark ? "#c0c0d8" : "#444", marginBottom: 14 }}>{para}</p>
                ))}
              </motion.div>

              {hero.researchFocus && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px",
                    borderRadius: 10, background: isDark ? "rgba(167,139,250,0.06)" : "rgba(124,58,237,0.06)",
                    border: `1px solid ${isDark ? "rgba(167,139,250,0.15)" : "rgba(124,58,237,0.15)"}`,
                    marginBottom: 28,
                  }}>
                  <BookOpen size={14} style={{ color: isDark ? N.violet : L.violet, marginTop: 2, flexShrink: 0 }} />
                  <p style={{ ...MONO, fontSize: 13, color: isDark ? N.violet : L.violet, lineHeight: 1.7, letterSpacing: "0.03em", margin: 0 }}>{hero.researchFocus}</p>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 32 }}>
                <a href={`mailto:${hero.email}`} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 26px", borderRadius: 10, fontSize: 15, fontWeight: 600,
                  background: `linear-gradient(135deg, ${N.teal}, #0d9488)`,
                  color: "#08080e", textDecoration: "none", boxShadow: `0 0 24px rgba(45,212,191,0.3)`,
                  transition: "all 0.25s ease",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 32px rgba(45,212,191,0.4)`; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 24px rgba(45,212,191,0.3)`; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <Mail size={16} /> Get in touch
                </a>
                <a href={resolveCvHref(hero, cvAsset)} download={resolveCvName(hero, "Hazem-Alabiad-CV.pdf")} style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 26px", borderRadius: 10, fontSize: 15,
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  color: textColor, textDecoration: "none", transition: "all 0.25s ease",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(45,212,191,0.3)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
                  <Download size={16} /> Download CV
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                {[
                  { href: `https://${hero.github}`, icon: <Github size={15} />, label: "GitHub" },
                  { href: `https://${hero.linkedin}`, icon: <Linkedin size={15} />, label: "LinkedIn" },
                ].map(link => (
                  <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" style={{
                    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
                    color: mutedColor, textDecoration: "none", transition: "color 0.2s ease",
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = N.teal}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = mutedColor}
                  >
                    {link.icon} {link.label}
                  </a>
                ))}
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: mutedColor }}>
                  <MapPin size={14} /> {hero.location}
                </span>
              </motion.div>
            </motion.div>

            {/* Right column — avatar + terminal */}
            <motion.div style={{ display: "flex", flexDirection: "column", gap: 24 }}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}>
              {/* Avatar with hexagon + animated ring */}
              <div className="float-avatar" style={{ width: 200, height: 200, margin: "0 auto", position: "relative" }}>
                <div className="avatar-ring" style={{
                  position: "absolute", inset: -4, borderRadius: "50%",
                  animation: "ringRotate 6s linear infinite",
                }} />
                <div className="hex-avatar" style={{
                  width: 200, height: 200, overflow: "hidden", position: "relative",
                  background: "#0d1117",
                  boxShadow: `0 0 0 3px rgba(45,212,191,0.4), 0 0 80px rgba(45,212,191,0.15), 0 0 120px rgba(45,212,191,0.08)`,
                }}>
                  <img src={profilePhoto} alt={hero.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 4%", filter: "brightness(0.93) contrast(1.05)" }} />
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 55%, rgba(4,4,12,0.4) 100%)" }} />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                {[
                  { icon: <Briefcase size={12} />, text: "6+ yrs", target: 6 },
                  { icon: <GraduationCap size={12} />, text: "M.A.", target: 1 },
                  { icon: <Globe size={12} />, text: "4 langs", target: 4 },
                ].map((stat, si) => (
                  <StatCounter key={stat.text} icon={stat.icon} label={stat.text} target={stat.target} delay={si * 0.15} isDark={isDark} mutedColor={mutedColor} />
                ))}
              </motion.div>

              <Terminal
                name={hero.name}
                email={hero.email}
                github={hero.github}
                linkedin={hero.linkedin}
                location={hero.location}
                skills={heroSkills}
              />
            </motion.div>
          </div>
        </motion.section>

        {/* ── Education ────────────────────────────────── */}
        <motion.section
          id="education"
          style={{ marginBottom: 120 }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}>
          <SectionHeader label="Education" id="education" icon={<GraduationCap size={18} />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {education.map((edu, i) => (
              <motion.div key={edu.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}>
                <GlassCard style={{ padding: "24px 28px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div>
                      <h3 style={{ ...SANS, fontSize: 17, fontWeight: 600, color: textColor, marginBottom: 4 }}>{edu.degree}</h3>
                      <p style={{ fontSize: 15, marginBottom: 8 }}>
                        <span style={{ color: N.teal }}>{edu.school}</span>
                        <span style={{ color: mutedColor }}> · {edu.location}</span>
                      </p>
                      {edu.notes && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Star size={12} style={{ color: N.violet, flexShrink: 0 }} />
                          <p style={{ ...MONO, fontSize: 12, color: isDark ? "#8080a8" : "#666", lineHeight: 1.6, margin: 0 }}>{edu.notes}</p>
                        </div>
                      )}
                    </div>
                    <span style={{ ...MONO, fontSize: 12, color: mutedColor, whiteSpace: "nowrap",
                      padding: "4px 10px", borderRadius: 6, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                    }}>{edu.period}</span>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Experience ───────────────────────────────── */}
        <motion.section
          id="experience"
          style={{ marginBottom: 120 }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}>
          <SectionHeader label="Experience" id="experience" icon={<Briefcase size={18} />} />
          <div style={{ position: "relative" }}>
            {groupByCompany(experience).map((group, gi, arr) => (
              <motion.div key={group.company + gi}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: gi * 0.1 }}
                style={{ position: "relative", paddingLeft: 28, paddingBottom: gi < arr.length - 1 ? 32 : 0 }}>
                <div style={{
                  position: "absolute", left: 0, top: 10, width: 10, height: 10, borderRadius: "50%",
                  background: N.teal, boxShadow: `0 0 10px ${N.teal}`, opacity: 0.7,
                }} />
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
                          <h3 style={{ ...SANS, fontSize: 16, fontWeight: 600, color: textColor, marginBottom: 3 }}>{group.roles[0].role}</h3>
                          <p style={{ fontSize: 14 }}>
                            <span style={{ color: N.teal }}>{group.company}</span>
                            <span style={{ color: mutedColor }}> · {group.location}</span>
                          </p>
                        </div>
                        <span style={{ ...MONO, fontSize: 12, color: mutedColor, whiteSpace: "nowrap",
                          padding: "4px 10px", borderRadius: 6, background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                        }}>{group.roles[0].period}</span>
                      </div>
                      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                        {group.roles[0].bullets.filter(Boolean).map((b, bi) => (
                          <li key={bi} style={{ display: "flex", gap: 10, fontSize: 15, color: isDark ? "#ababc0" : "#555", lineHeight: 1.7 }}>
                            <ChevronRight size={14} style={{ color: N.teal, opacity: 0.5, marginTop: 2, flexShrink: 0 }} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <h3 style={{ ...SANS, fontSize: 17, fontWeight: 700, color: N.teal, marginBottom: 2 }}>{group.company}</h3>
                        <p style={{ fontSize: 14, color: mutedColor, margin: 0 }}>{group.location}</p>
                      </div>
                      <div style={{ borderLeft: `2px solid rgba(45,212,191,0.15)`, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 20 }}>
                        {group.roles.map(role => (
                          <div key={role.id}>
                            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                              <span style={{ ...SANS, fontSize: 15, fontWeight: 500, color: textColor }}>{role.role}</span>
                              <span style={{ ...MONO, fontSize: 12, color: mutedColor }}>{role.period}</span>
                            </div>
                            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
                              {role.bullets.filter(Boolean).map((b, bi) => (
                                <li key={bi} style={{ display: "flex", gap: 10, fontSize: 14, color: isDark ? "#ababc0" : "#555", lineHeight: 1.7 }}>
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
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Projects ─────────────────────────────────── */}
        <motion.section
          id="projects"
          style={{ marginBottom: 120 }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}>
          <SectionHeader label="Research & Projects" id="projects" icon={<FlaskConical size={18} />} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {projects.map((proj, i) => (
              <motion.div key={proj.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}>
                <a href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                  target="_blank" rel="noopener noreferrer" className="proj-card"
                  style={{ textDecoration: "none", display: "block" }}
                  onClick={() => setExpandedProject(expandedProject === proj.id ? null : proj.id)}>
                  <GlassCard style={{ padding: "22px", height: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `rgba(${i % 2 === 0 ? "45,212,191" : "167,139,250"},0.12)`,
                        border: `1px solid rgba(${i % 2 === 0 ? "45,212,191" : "167,139,250"},0.2)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: i % 2 === 0 ? N.teal : N.violet,
                      }}>
                        {i % 3 === 0 ? <Brain size={18} /> : i % 3 === 1 ? <Layers size={18} /> : <Zap size={18} />}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ ...MONO, fontSize: 13, color: mutedColor }}>{proj.year}</span>
                        <ArrowUpRight size={15} style={{ color: mutedColor }} />
                      </div>
                    </div>
                    <h3 style={{ ...SANS, fontSize: 17, fontWeight: 600, color: textColor, marginBottom: 8, lineHeight: 1.3 }}>{proj.title}</h3>
                    {expandedProject === proj.id && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        transition={{ duration: 0.3 }}
                        style={{ fontSize: 15, color: isDark ? "#8f8fa8" : "#666", lineHeight: 1.7, marginBottom: 12, overflow: "hidden" }}>
                        {proj.description}
                      </motion.p>
                    )}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(proj.tags || []).map(tag => (
                        <span key={tag} style={{
                          ...MONO, fontSize: 12, padding: "3px 8px", borderRadius: 6,
                          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)",
                          border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                          color: isDark ? "#a0a0b8" : "#666",
                        }}>{tag}</span>
                      ))}
                    </div>
                  </GlassCard>
                </a>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* ── Skills ───────────────────────────────────── */}
        <motion.section
          id="skills"
          style={{ marginBottom: 120 }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}>
          <SectionHeader label="Skills" id="skills" icon={<Code2 size={18} />} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {skills.map(sg => (
              <GlassCard key={sg.id} style={{ padding: "22px 28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(45,212,191,0.12)", border: "1px solid rgba(45,212,191,0.25)", color: N.teal,
                    boxShadow: "0 0 12px rgba(45,212,191,0.08)",
                  }}>{skillGroupIcons[sg.label] ?? <Star size={16} />}</div>
                  <span style={{ ...MONO, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.22em", color: N.teal }}>{sg.label}</span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                  {sg.skills.split(",").map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="skill-tag" style={{
                      ...MONO, fontSize: 14, padding: "7px 14px", borderRadius: 8,
                      background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                      border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
                      color: isDark ? "#a0a0b8" : "#666",
                    }}>
                      {skillIcons[skill] && <span style={{ marginRight: 5 }}>{skillIcons[skill]}</span>}{skill}
                    </span>
                  ))}
                </div>
                {/* Skill proficiency ring */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <svg width="50" height="50" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="40" fill="none" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} strokeWidth="6" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={N.teal} strokeWidth="6"
                      strokeDasharray={251} strokeDashoffset={251 - (251 * (sg.level || 80)) / 100}
                      strokeLinecap="round"
                      style={{ animation: "ringFill 1.2s ease forwards", transition: "stroke-dashoffset 1s ease" }} />
                  </svg>
                  <span style={{ ...MONO, fontSize: 13, color: mutedColor }}>{sg.label} — {sg.level || 80}%</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </motion.section>

        {/* ── Languages ────────────────────────────────── */}
        {languages.length > 0 && (
          <motion.section
            id="languages"
            style={{ marginBottom: 100 }}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6 }}>
            <SectionHeader label="Languages" id="languages" icon={<Globe size={18} />} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {languages.map(lang => (
                <GlassCard key={lang.id} style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ ...SANS, fontSize: 17, fontWeight: 500, color: textColor }}>{lang.name}</span>
                  <span style={{
                    ...MONO, fontSize: 13, padding: "4px 12px", borderRadius: 20,
                    background: "rgba(45,212,191,0.08)", color: N.teal, border: "1px solid rgba(45,212,191,0.18)",
                  }}>{lang.level}</span>
                  {/* proficiency bar */}
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${lang.pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                      style={{
                        height: "100%", borderRadius: 2,
                        background: `linear-gradient(90deg, ${N.teal}, ${N.violet})`,
                      }} />
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 1, borderTop: `1px solid ${N.border}`,
        padding: "32px 2rem",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <p style={{ ...MONO, fontSize: 13, color: N.muted }}>© {currentYear} {hero.name}</p>
          {visitCount !== null && (
            <span style={{ ...MONO, fontSize: 13, color: N.muted, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: N.teal, opacity: 0.6, display: "inline-block", boxShadow: `0 0 8px ${N.teal}` }} />
              {visitCount.toLocaleString()} visits
            </span>
          )}
        </div>
      </footer>

      {/* CMS button */}
      <motion.button
        whileHover={{ scale: 1.08, boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 20px rgba(45,212,191,0.35)` }}
        onClick={() => { window.location.hash = "#/cms"; setHash("#/cms"); }}
        title="Open CMS"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9998,
          width: 48, height: 48, borderRadius: "50%",
          background: N.bg,
          border: "1px solid rgba(45,212,191,0.4)",
          color: N.teal, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.6), 0 0 16px rgba(45,212,191,0.15)",
          transition: "all 0.25s ease",
        }}
      >
        <Settings size={20} />
      </motion.button>
    </div>
  );
}