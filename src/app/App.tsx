import { useState, useEffect } from "react";
import {
  Github, Linkedin, Mail, MapPin,
  ArrowUpRight, Download, Settings, Briefcase, GraduationCap, Code2, Globe,
} from "lucide-react";
import profilePhoto from "@/imports/IMG_0323.jpeg";
import cvAsset from "@/imports/Hazem-Alabiad-CV.pdf?url";
import { resolveCvHref, resolveCvName } from "./cv";
import CmsPage from "./components/CmsPage";

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
    bio: "Software Engineer with 6+ years of experience building production-ready systems and pixel-perfect UIs. Currently pursuing an M.A. in Computational Linguistics at the University of Tübingen, focusing on AI, LLMs, NLP, and Cognitive Science.",
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
    { id: "e3", role: "Software Engineer (Working Student)", company: "IBM", location: "Böblingen, Germany", period: "Jun 2024 – Apr 2026", bullets: ["Built production React UI for IBM's Data Quality platform serving 1M+ enterprise users", "Maintained 300+ regression and E2E tests with Puppeteer and Cypress", "Led accessibility improvements: ARIA, screen reader support, keyboard navigation"] },
    { id: "e4", role: "Frontend Developer", company: "Getir", location: "Ankara, Turkey", period: "Dec 2022 – Mar 2024", bullets: ["Maintained GetirJobs (2.2M+ users); led two greenfield React/TypeScript projects", "Boosted dev server speed 3× via Vite migration", "Raised component test coverage to 70% with Playwright and Jest"] },
    { id: "e5", role: "Engineering Lead", company: "Arianna Suisse Sa", location: "Remote · Switzerland", period: "Jun 2022 – Nov 2022", bullets: ["Led 4 engineers and 1 designer, delivering on time and within budget", "Architected scalable GraphQL API with Apollo Federation and MySQL"] },
    { id: "e6", role: "Full-Stack Developer", company: "Arianna Suisse Sa", location: "Remote · Switzerland", period: "May 2021 – Jun 2022", bullets: ["Built reusable React components; managed GraphQL server with Apollo Federation", "Custom Elasticsearch search engine and real-time multi-user editing via WebSocket"] },
    { id: "e7", role: "Freelance Software Developer", company: "Self-employed", location: "Remote · USA", period: "Feb 2020 – Feb 2021", bullets: ["Built pixel-perfect React UIs for 3 international clients", "Python web crawlers publishing to RabbitMQ queues for backend AI pipelines"] },
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

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const DISPLAY: React.CSSProperties = { fontFamily: "'DM Serif Display', serif" };
const SANS: React.CSSProperties = { fontFamily: "'DM Sans', sans-serif" };

function BentoCard({
  children, className = "", style = {}, glow = false,
  onClick, href,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  glow?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const base: React.CSSProperties = {
    background: "#0f0f18",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 20,
    padding: 28,
    position: "relative",
    overflow: "hidden",
    transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
    ...style,
  };
  const glowStyle: React.CSSProperties = glow
    ? { boxShadow: "0 0 40px rgba(94,234,212,0.08), inset 0 1px 0 rgba(94,234,212,0.06)" }
    : {};

  const handleEnter = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,234,212,0.25)";
    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(94,234,212,0.1)";
  };
  const handleLeave = (e: React.MouseEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
    (e.currentTarget as HTMLElement).style.boxShadow = glow ? "0 0 40px rgba(94,234,212,0.08)" : "none";
  };

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className={className} style={{ ...base, ...glowStyle, display: "block", textDecoration: "none" }}
        onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
        {children}
      </a>
    );
  }
  return (
    <div className={className} style={{ ...base, ...glowStyle, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span style={{ ...MONO, fontSize: 11, padding: "3px 10px", borderRadius: 6, background: "rgba(94,234,212,0.07)", border: "1px solid rgba(94,234,212,0.18)", color: "#5eead4", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [data, setData] = useState<SiteContent>(seed);
  const [activeTab, setActiveTab] = useState<"experience" | "education">("experience");

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
    const desc = data.hero.bio.slice(0, 155);
    document.querySelector('meta[name="description"]')?.setAttribute("content", desc);
  }, [data.hero]);

  if (hash === "#/cms") return <CmsPage onExit={() => { window.location.hash = ""; setHash(""); }} />;

  const { hero, experience, projects, skills, education, languages } = data;
  const allSkills = skills.flatMap(sg => sg.skills.split(",").map(s => s.trim()).filter(Boolean));
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ minHeight: "100vh", background: "#08080f", color: "#d4d4e0", ...SANS }}>

      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 40,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 32px", height: 60,
        background: "rgba(8,8,15,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ ...DISPLAY, color: "#5eead4", fontSize: 18 }}>{hero.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a href={`https://${hero.github}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9494a8", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#5eead4"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,234,212,0.35)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#9494a8"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
            <Github size={16} />
          </a>
          <a href={`https://${hero.linkedin}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9494a8", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#5eead4"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,234,212,0.35)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#9494a8"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
            <Linkedin size={16} />
          </a>
          <a href={`mailto:${hero.email}`}
            style={{ ...MONO, fontSize: 12, padding: "6px 16px", borderRadius: 10, background: "rgba(94,234,212,0.1)", border: "1px solid rgba(94,234,212,0.25)", color: "#5eead4", textDecoration: "none", transition: "all 0.2s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(94,234,212,0.18)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(94,234,212,0.1)"; }}>
            Hire me
          </a>
        </div>
      </nav>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "88px 24px 60px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridAutoRows: "minmax(0, auto)",
          gap: 16,
        }}>

          {/* CARD 1: Hero */}
          <BentoCard glow style={{ gridColumn: "1 / 9", gridRow: "1" }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(94,234,212,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img src={profilePhoto} alt={hero.name}
                  style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", objectPosition: "center 4%", border: "2px solid rgba(94,234,212,0.3)" }} />
                <span style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: "#22c55e", border: "2px solid #0f0f18" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <h1 style={{ ...DISPLAY, fontSize: 28, color: "#eeeef5", margin: 0, lineHeight: 1.1 }}>{hero.name}</h1>
                  <span style={{ ...MONO, fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>Open to work</span>
                </div>
                <p style={{ ...MONO, fontSize: 12, color: "#5eead4", margin: "0 0 12px", opacity: 0.8 }}>{hero.tagline}</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "#a0a0b8", margin: "0 0 16px", maxWidth: "52ch" }}>{hero.bio}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {["TypeScript", "React", "Node.js", "Python", "NLP", "LLMs"].map(s => <Tag key={s} label={s} />)}
                </div>
              </div>
            </div>
          </BentoCard>

          {/* CARD 2: Contact */}
          <BentoCard style={{ gridColumn: "9 / 13", gridRow: "1", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 16 }}>
            <div>
              <p style={{ ...MONO, fontSize: 10, color: "#5eead4", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>Contact</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href={`mailto:${hero.email}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "#a0a0b8", textDecoration: "none", fontSize: 13, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#5eead4"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#a0a0b8"}>
                  <Mail size={13} style={{ flexShrink: 0, color: "#5eead4" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hero.email}</span>
                </a>
                <a href={`https://${hero.github}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "#a0a0b8", textDecoration: "none", fontSize: 13, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#5eead4"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#a0a0b8"}>
                  <Github size={13} style={{ flexShrink: 0, color: "#5eead4" }} />
                  <span>{hero.github}</span>
                </a>
                <a href={`https://${hero.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, color: "#a0a0b8", textDecoration: "none", fontSize: 13, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#5eead4"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#a0a0b8"}>
                  <Linkedin size={13} style={{ flexShrink: 0, color: "#5eead4" }} />
                  <span>{hero.linkedin}</span>
                </a>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b6b82", fontSize: 13 }}>
                  <MapPin size={13} style={{ flexShrink: 0 }} />
                  <span>{hero.location}</span>
                </span>
              </div>
            </div>
            <a href={resolveCvHref(hero, cvAsset)} download={resolveCvName(hero, "Hazem-Alabiad-CV.pdf")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 0", borderRadius: 12, background: "rgba(94,234,212,0.08)", border: "1px solid rgba(94,234,212,0.2)", color: "#5eead4", textDecoration: "none", fontSize: 13, ...MONO, transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(94,234,212,0.15)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(94,234,212,0.08)"}>
              <Download size={13} /> Download CV
            </a>
          </BentoCard>

          {/* Stats row */}
          {[
            { label: "Years Exp.", value: "6+", sub: "production systems" },
            { label: "Companies", value: "6", sub: "across 4 countries" },
            { label: "Users Reached", value: "3M+", sub: "via shipped products" },
            { label: "Research", value: "M.A.", sub: "Comp. Linguistics" },
          ].map((stat, i) => (
            <BentoCard key={i} style={{ gridColumn: `${1 + i * 3} / ${4 + i * 3}`, gridRow: "2", padding: "20px 22px" }}>
              <p style={{ ...MONO, fontSize: 11, color: "#5b5b74", textTransform: "uppercase", letterSpacing: "0.15em", margin: "0 0 6px" }}>{stat.label}</p>
              <p style={{ ...DISPLAY, fontSize: 30, color: "#eeeef5", margin: "0 0 2px", lineHeight: 1 }}>{stat.value}</p>
              <p style={{ fontSize: 12, color: "#6b6b82", margin: 0 }}>{stat.sub}</p>
            </BentoCard>
          ))}

          {/* CARD 4: Experience / Education tabbed */}
          <BentoCard style={{ gridColumn: "1 / 9", gridRow: "3" }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12, width: "fit-content" }}>
              {(["experience", "education"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    ...MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                    padding: "6px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                    transition: "all 0.2s",
                    background: activeTab === tab ? "rgba(94,234,212,0.12)" : "transparent",
                    color: activeTab === tab ? "#5eead4" : "#6b6b82",
                  }}>
                  {tab === "experience" ? <><Briefcase size={10} style={{ display: "inline", marginRight: 5 }} />Experience</> : <><GraduationCap size={10} style={{ display: "inline", marginRight: 5 }} />Education</>}
                </button>
              ))}
            </div>
            {activeTab === "experience" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {experience.slice(0, 4).map(exp => (
                  <div key={exp.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(94,234,212,0.06)", border: "1px solid rgba(94,234,212,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Briefcase size={15} style={{ color: "#5eead4", opacity: 0.7 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#eeeef5" }}>{exp.role}</span>
                        <span style={{ ...MONO, fontSize: 10, color: "#5b5b74", whiteSpace: "nowrap" }}>{exp.period}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "#5eead4", opacity: 0.75 }}>{exp.company}</span>
                      {exp.bullets[0] && <p style={{ fontSize: 13, color: "#7a7a90", margin: "4px 0 0", lineHeight: 1.6 }}>{exp.bullets[0]}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "education" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {education.map(edu => (
                  <div key={edu.id} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(94,234,212,0.06)", border: "1px solid rgba(94,234,212,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <GraduationCap size={15} style={{ color: "#5eead4", opacity: 0.7 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: "#eeeef5" }}>{edu.degree}</span>
                        <span style={{ ...MONO, fontSize: 10, color: "#5b5b74", whiteSpace: "nowrap" }}>{edu.period}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "#5eead4", opacity: 0.75 }}>{edu.school} · {edu.location}</span>
                      {edu.notes && <p style={{ fontSize: 13, color: "#7a7a90", margin: "4px 0 0", lineHeight: 1.6 }}>{edu.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>

          {/* CARD 5: Research + Languages */}
          <BentoCard style={{ gridColumn: "9 / 13", gridRow: "3", display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ ...MONO, fontSize: 10, color: "#5eead4", letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>Research Focus</p>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              {["Corpus Linguistics", "Large Language Models", "Cognitive Science", "NLP", "ML / Deep Learning"].map(topic => (
                <div key={topic} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5eead4", opacity: 0.5, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "#a0a0b8" }}>{topic}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {languages.map(l => (
                <span key={l.id} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#7a7a90" }}>
                  {l.name} <span style={{ color: "#5b5b74" }}>· {l.level}</span>
                </span>
              ))}
            </div>
          </BentoCard>

          {/* CARD 6: Projects 50/50 */}
          {projects.slice(0, 2).map((proj, i) => (
            <BentoCard key={proj.id} href={proj.link} style={{ gridColumn: i === 0 ? "1 / 7" : "7 / 13", gridRow: "4" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span style={{ ...MONO, fontSize: 10, color: "#5eead4", opacity: 0.6 }}>{proj.year}</span>
                <ArrowUpRight size={14} style={{ color: "#5b5b74" }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#eeeef5", margin: "0 0 8px", lineHeight: 1.3 }}>{proj.title}</h3>
              <p style={{ fontSize: 13, color: "#7a7a90", margin: 0, lineHeight: 1.6 }}>{proj.description}</p>
            </BentoCard>
          ))}

          {/* CARD 7: Skills */}
          <BentoCard style={{ gridColumn: "1 / 9", gridRow: "5" }}>
            <p style={{ ...MONO, fontSize: 10, color: "#5eead4", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>Skills & Tools</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allSkills.map(skill => (
                <span key={skill} style={{ fontSize: 13, padding: "5px 12px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#9494a8", transition: "all 0.2s", cursor: "default" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(94,234,212,0.07)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,234,212,0.2)"; (e.currentTarget as HTMLElement).style.color = "#5eead4"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLElement).style.color = "#9494a8"; }}>
                  {skill}
                </span>
              ))}
            </div>
          </BentoCard>

          {/* CARD 8: More projects */}
          <BentoCard style={{ gridColumn: "9 / 13", gridRow: "5", display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ ...MONO, fontSize: 10, color: "#5eead4", letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>More Projects</p>
            {projects.slice(2).map(proj => (
              <a key={proj.id} href={proj.link} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,234,212,0.2)"; (e.currentTarget as HTMLElement).style.background = "rgba(94,234,212,0.04)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}>
                <div>
                  <p style={{ fontSize: 13, color: "#d4d4e0", margin: "0 0 2px", fontWeight: 500 }}>{proj.title}</p>
                  <p style={{ ...MONO, fontSize: 10, color: "#5b5b74", margin: 0 }}>{proj.year}</p>
                </div>
                <ArrowUpRight size={13} style={{ color: "#5b5b74", flexShrink: 0 }} />
              </a>
            ))}
            <a href={`https://${hero.github}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 6, color: "#5b5b74", textDecoration: "none", fontSize: 12, ...MONO, marginTop: "auto" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#5eead4"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#5b5b74"}>
              <Code2 size={12} /> View all on GitHub <ArrowUpRight size={11} />
            </a>
          </BentoCard>

        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ ...MONO, fontSize: 11, color: "#3a3a50", margin: 0 }}>© {currentYear} {hero.name}</p>
          {visitCount !== null && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, ...MONO, fontSize: 11, color: "#3a3a50" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5eead4", opacity: 0.4, display: "inline-block" }} />
              {visitCount.toLocaleString()} visits
            </span>
          )}
          <a href={`https://github.com/${OWNER}/${REPO}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 4, ...MONO, fontSize: 11, color: "#3a3a50", textDecoration: "none", transition: "color 0.2s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#5eead4"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#3a3a50"}>
            <Globe size={11} /> Source
          </a>
        </div>
      </main>

      <button
        onClick={() => { window.location.hash = "#/cms"; setHash("#/cms"); }}
        title="Open CMS"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9998,
          width: 44, height: 44, borderRadius: "50%",
          background: "#111119", border: "1px solid rgba(94,234,212,0.35)",
          color: "#5eead4", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)", transition: "all 0.2s ease",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#1a1a2e"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#111119"}
      >
        <Settings size={18} />
      </button>
    </div>
  );
}
