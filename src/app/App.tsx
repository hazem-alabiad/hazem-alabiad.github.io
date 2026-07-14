import { useState, useEffect } from "react";
import {
  Github, Linkedin, Mail, MapPin,
  ArrowUpRight, Download, Settings,
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

/* ─── Seed (fallback) ────────────────────────────────────── */
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

export default function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [ownerChecked, setOwnerChecked] = useState(false);
  const [data, setData] = useState<SiteContent>(seed);

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
  const currentYear = new Date().getFullYear();

  return (
    <div style={{ minHeight: "100vh", background: "#f8f8f2", color: "#1a1a2e", ...SANS }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>

        {/* Header */}
        <header style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
            <img
              src={profilePhoto}
              alt={hero.name}
              style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", objectPosition: "center 4%", flexShrink: 0 }}
            />
            <div>
              <h1 style={{ ...DISPLAY, fontSize: 28, margin: "0 0 4px", color: "#0f0f1a" }}>{hero.name}</h1>
              <p style={{ ...MONO, fontSize: 12, color: "#6b6b8a", margin: "0 0 8px" }}>{hero.tagline}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <MapPin size={13} style={{ color: "#9494aa" }} />
                <span style={{ fontSize: 13, color: "#9494aa" }}>{hero.location}</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.8, color: "#4a4a5e", margin: "0 0 20px" }}>{hero.bio}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href={`mailto:${hero.email}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a4a5e", textDecoration: "none" }}>
              <Mail size={14} />{hero.email}
            </a>
            <a href={`https://${hero.github}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a4a5e", textDecoration: "none" }}>
              <Github size={14} />{hero.github}
            </a>
            <a href={`https://${hero.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a4a5e", textDecoration: "none" }}>
              <Linkedin size={14} />{hero.linkedin}
            </a>
            <a href={resolveCvHref(hero, cvAsset)} download={resolveCvName(hero, "Hazem-Alabiad-CV.pdf")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a4a5e", textDecoration: "none" }}>
              <Download size={14} />CV
            </a>
          </div>
        </header>

        {/* Experience */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ ...MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#9494aa", marginBottom: 16 }}>Experience</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {experience.map(exp => (
              <div key={exp.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f0f1a" }}>{exp.role}</span>
                  <span style={{ ...MONO, fontSize: 11, color: "#9494aa" }}>{exp.period}</span>
                </div>
                <p style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 6 }}>{exp.company} · {exp.location}</p>
                <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                  {exp.bullets.filter(Boolean).map((b, i) => (
                    <li key={i} style={{ fontSize: 13, color: "#4a4a5e", lineHeight: 1.6 }}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ ...MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#9494aa", marginBottom: 16 }}>Education</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {education.map(edu => (
              <div key={edu.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#0f0f1a" }}>{edu.degree}</span>
                  <span style={{ ...MONO, fontSize: 11, color: "#9494aa" }}>{edu.period}</span>
                </div>
                <p style={{ fontSize: 13, color: "#6b6b8a", marginBottom: 4 }}>{edu.school} · {edu.location}</p>
                {edu.notes && <p style={{ fontSize: 13, color: "#7a7a90" }}>{edu.notes}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ ...MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#9494aa", marginBottom: 16 }}>Projects</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {projects.map(proj => (
              <a key={proj.id} href={proj.link} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}>
                <div>
                  <span style={{ fontSize: 14, color: "#0f0f1a", fontWeight: 500 }}>{proj.title}</span>
                  <span style={{ ...MONO, fontSize: 11, color: "#9494aa", marginLeft: 10 }}>{proj.year}</span>
                </div>
                <ArrowUpRight size={14} style={{ color: "#9494aa", flexShrink: 0 }} />
              </a>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section style={{ marginBottom: 40 }}>
          <h2 style={{ ...MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#9494aa", marginBottom: 16 }}>Skills</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {skills.map(sg => (
              <div key={sg.id} style={{ display: "flex", gap: 12 }}>
                <span style={{ ...MONO, fontSize: 12, color: "#9494aa", minWidth: 80 }}>{sg.label}</span>
                <span style={{ fontSize: 13, color: "#4a4a5e" }}>{sg.skills}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Languages */}
        {languages.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ ...MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#9494aa", marginBottom: 16 }}>Languages</h2>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {languages.map(lang => (
                <span key={lang.id} style={{ fontSize: 13, color: "#4a4a5e" }}>
                  {lang.name} <span style={{ color: "#9494aa" }}>· {lang.level}</span>
                </span>
              ))}
            </div>
          </section>
        )}

        <footer style={{ paddingTop: 32, borderTop: "1px solid #e8e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ ...MONO, fontSize: 11, color: "#c0c0d0" }}>© {currentYear} {hero.name}</p>
          {visitCount !== null && (
            <span style={{ ...MONO, fontSize: 11, color: "#c0c0d0" }}>{visitCount.toLocaleString()} visits</span>
          )}
        </footer>
      </div>

      <button
        onClick={() => { window.location.hash = "#/cms"; setHash("#/cms"); }}
        title="Open CMS"
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9998,
          width: 44, height: 44, borderRadius: "50%",
          background: "#fff", border: "1px solid #e0e0ec",
          color: "#9494aa", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        }}
      >
        <Settings size={18} />
      </button>
    </div>
  );
}
