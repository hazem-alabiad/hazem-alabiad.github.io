import { useState, useEffect, type ChangeEvent } from "react";
import {
  Github, Linkedin, Mail, MapPin, Edit3, X, Plus, Trash2,
  ArrowUpRight, Download, RotateCcw,
} from "lucide-react";
import profilePhoto from "@/imports/IMG_0323.jpeg";
import cvAsset from "@/imports/Hazem-Alabiad-CV.pdf?url";
import { canShowEditContent, OWNER_GITHUB_USERNAME, resolveCvHref, resolveCvName, verifyOwnerGitHubToken } from "./cv";

/* ─── Types ─────────────────────────────────────────────── */
interface HeroContent {
  name: string; tagline: string; location: string; bio: string;
  researchFocus: string; email: string; phone: string;
  github: string; linkedin: string; cvUrl: string;
  cvFileData?: string; cvFileName?: string;
}
interface ExpItem {
  id: string; role: string; company: string; location: string;
  period: string; bullets: string[];
}
interface ProjItem {
  id: string; title: string; year: string; description: string; link: string;
}
interface SkillGroup { id: string; label: string; skills: string; }
interface EduItem {
  id: string; degree: string; school: string; location: string;
  period: string; notes: string;
}
interface LangItem { id: string; name: string; level: string; }
interface SiteContent {
  hero: HeroContent;
  experience: ExpItem[];
  projects: ProjItem[];
  skills: SkillGroup[];
  education: EduItem[];
  languages: LangItem[];
}

/* ─── Seed Data ──────────────────────────────────────────── */
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
function uid() { return Math.random().toString(36).slice(2, 9); }

function groupByCompany(items: ExpItem[]) {
  const groups: { company: string; location: string; roles: ExpItem[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && last.company === item.company) {
      last.roles.push(item);
    } else {
      groups.push({ company: item.company, location: item.location, roles: [item] });
    }
  }
  return groups;
}
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const DISPLAY: React.CSSProperties = { fontFamily: "'DM Serif Display', serif" };

/* ─── Section Header ─────────────────────────────────────── */
function SectionHeader({ label, id }: { label: string; id: string }) {
  return (
    <div id={id} className="flex items-center gap-5 mb-12 scroll-mt-24">
      <span className="text-[11px] tracking-[0.25em] uppercase shrink-0" style={{ ...MONO, color: "#5eead4" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "oklch(1 0 0 / 0.07)" }} />
    </div>
  );
}

/* ─── Social Link ────────────────────────────────────────── */
function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target={href.startsWith("mailto") ? undefined : "_blank"}
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm transition-colors hover:text-[#5eead4]"
      style={{ color: "#6b6b82" }}
    >
      {icon} {label}
    </a>
  );
}

/* ─── CMS Field ──────────────────────────────────────────── */
function Field({ label, value, onChange, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
  const cls = "w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-[#d4d4e0] focus:outline-none focus:border-[#5eead4]/50 transition-colors";
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-[0.2em] text-[#6b6b82]" style={MONO}>
        {label}
      </label>
      {multiline
        ? <textarea className={`${cls} resize-none min-h-[72px]`} value={value} onChange={e => onChange(e.target.value)} />
        : <input className={cls} value={value} onChange={e => onChange(e.target.value)} />
      }
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-2.5 rounded border border-dashed flex items-center justify-center gap-2 text-xs transition-colors hover:text-[#5eead4]"
      style={{ ...MONO, borderColor: "oklch(1 0 0 / 0.15)", color: "#6b6b82" }}
    >
      <Plus size={13} /> {label}
    </button>
  );
}

/* ─── Content Manager ────────────────────────────────────── */
type CmsTab = "hero" | "experience" | "projects" | "skills" | "education" | "languages";

function ContentManager({ content, onChange, onClose, onReset }: {
  content: SiteContent; onChange: (c: SiteContent) => void;
  onClose: () => void; onReset: () => void;
}) {
  const [tab, setTab] = useState<CmsTab>("hero");

  const upHero = (k: keyof HeroContent, v: string) =>
    onChange({ ...content, hero: { ...content.hero, [k]: v } });

  const handleCvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Please choose a PDF file for your CV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      onChange({
        ...content,
        hero: {
          ...content.hero,
          cvFileData: dataUrl,
          cvFileName: file.name,
          cvUrl: "",
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const upExp = (id: string, k: keyof Omit<ExpItem, "id" | "bullets">, v: string) =>
    onChange({ ...content, experience: content.experience.map(e => e.id === id ? { ...e, [k]: v } : e) });
  const upExpBullets = (id: string, v: string) =>
    onChange({ ...content, experience: content.experience.map(e => e.id === id ? { ...e, bullets: v.split("\n") } : e) });
  const addExp = () => onChange({ ...content, experience: [...content.experience, { id: uid(), role: "New Role", company: "Company", location: "", period: "", bullets: [] }] });
  const delExp = (id: string) => onChange({ ...content, experience: content.experience.filter(e => e.id !== id) });

  const upProj = (id: string, k: keyof Omit<ProjItem, "id">, v: string) =>
    onChange({ ...content, projects: content.projects.map(p => p.id === id ? { ...p, [k]: v } : p) });
  const addProj = () => onChange({ ...content, projects: [...content.projects, { id: uid(), title: "New Project", year: new Date().getFullYear().toString(), description: "", link: "" }] });
  const delProj = (id: string) => onChange({ ...content, projects: content.projects.filter(p => p.id !== id) });

  const upSkill = (id: string, k: keyof Omit<SkillGroup, "id">, v: string) =>
    onChange({ ...content, skills: content.skills.map(s => s.id === id ? { ...s, [k]: v } : s) });
  const addSkill = () => onChange({ ...content, skills: [...content.skills, { id: uid(), label: "Category", skills: "" }] });
  const delSkill = (id: string) => onChange({ ...content, skills: content.skills.filter(s => s.id !== id) });

  const upEdu = (id: string, k: keyof Omit<EduItem, "id">, v: string) =>
    onChange({ ...content, education: content.education.map(e => e.id === id ? { ...e, [k]: v } : e) });
  const addEdu = () => onChange({ ...content, education: [...content.education, { id: uid(), degree: "Degree", school: "School", location: "", period: "", notes: "" }] });
  const delEdu = (id: string) => onChange({ ...content, education: content.education.filter(e => e.id !== id) });

  const upLang = (id: string, k: keyof Omit<LangItem, "id">, v: string) =>
    onChange({ ...content, languages: content.languages.map(l => l.id === id ? { ...l, [k]: v } : l) });
  const addLang = () => onChange({ ...content, languages: [...content.languages, { id: uid(), name: "Language", level: "Beginner" }] });
  const delLang = (id: string) => onChange({ ...content, languages: content.languages.filter(l => l.id !== id) });

  const tabs: Array<{ key: CmsTab; label: string }> = [
    { key: "hero", label: "Profile" },
    { key: "experience", label: "Work" },
    { key: "projects", label: "Research" },
    { key: "skills", label: "Skills" },
    { key: "education", label: "Education" },
    { key: "languages", label: "Languages" },
  ];

  const cardStyle: React.CSSProperties = { background: "#111119", borderColor: "oklch(1 0 0 / 0.08)" };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch">
      <div className="flex-1 cursor-pointer" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div className="w-[460px] flex flex-col border-l overflow-hidden" style={{ background: "#0c0c13", borderColor: "oklch(1 0 0 / 0.09)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b" style={{ borderColor: "oklch(1 0 0 / 0.07)" }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] mb-0.5" style={{ ...MONO, color: "#5eead4" }}>Content Manager</p>
            <p className="text-[#d4d4e0] text-sm font-medium">Edit · saves automatically</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onReset} title="Reset to defaults" className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/5 hover:text-red-400" style={{ color: "#6b6b82" }}>
              <RotateCcw size={13} />
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded transition-colors hover:bg-white/5 hover:text-[#d4d4e0]" style={{ color: "#6b6b82" }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b px-1 overflow-x-auto" style={{ borderColor: "oklch(1 0 0 / 0.07)" }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="relative px-3 py-3 text-[11px] tracking-wide transition-colors whitespace-nowrap" style={{ ...MONO, color: tab === t.key ? "#5eead4" : "#6b6b82" }}>
              {t.label}
              {tab === t.key && <span className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "#5eead4" }} />}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {tab === "hero" && <>
            <Field label="Name" value={content.hero.name} onChange={v => upHero("name", v)} />
            <Field label="Tagline" value={content.hero.tagline} onChange={v => upHero("tagline", v)} />
            <Field label="Location" value={content.hero.location} onChange={v => upHero("location", v)} />
            <Field label="Bio" value={content.hero.bio} onChange={v => upHero("bio", v)} multiline />
            <Field label="Research Focus" value={content.hero.researchFocus} onChange={v => upHero("researchFocus", v)} />
            <Field label="Email" value={content.hero.email} onChange={v => upHero("email", v)} />
            <Field label="Phone" value={content.hero.phone} onChange={v => upHero("phone", v)} />
            <Field label="GitHub" value={content.hero.github} onChange={v => upHero("github", v)} />
            <Field label="LinkedIn" value={content.hero.linkedin} onChange={v => upHero("linkedin", v)} />
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-[#6b6b82]" style={MONO}>CV / Resume File</label>
              <p className="text-xs text-[#6b6b82]">Upload your CV as a PDF file. The site will store it and offer it as a download.</p>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleCvUpload}
                className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#d4d4e0] file:mr-3 file:rounded file:border-0 file:bg-[#5eead4] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#09090f]"
              />
              {content.hero.cvFileName && (
                <p className="text-xs text-[#6b6b82]">Uploaded: {content.hero.cvFileName}</p>
              )}
              {content.hero.cvFileData && (
                <button
                  type="button"
                  onClick={() => onChange({ ...content, hero: { ...content.hero, cvFileData: "", cvFileName: "", cvUrl: "" } })}
                  className="text-xs text-[#6b6b82] transition-colors hover:text-red-400"
                >
                  Clear uploaded CV
                </button>
              )}
            </div>
          </>}

          {tab === "experience" && <div className="space-y-5">
            {content.experience.map((e, i) => (
              <div key={e.id} className="rounded-lg p-4 space-y-3 border" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest" style={{ ...MONO, color: "#5eead4" }}>#{i + 1}</span>
                  <button onClick={() => delExp(e.id)} className="transition-colors hover:text-red-400" style={{ color: "#6b6b82" }}><Trash2 size={13} /></button>
                </div>
                <Field label="Role" value={e.role} onChange={v => upExp(e.id, "role", v)} />
                <Field label="Company" value={e.company} onChange={v => upExp(e.id, "company", v)} />
                <Field label="Location" value={e.location} onChange={v => upExp(e.id, "location", v)} />
                <Field label="Period" value={e.period} onChange={v => upExp(e.id, "period", v)} />
                <Field label="Bullets (one per line)" value={e.bullets.join("\n")} onChange={v => upExpBullets(e.id, v)} multiline />
              </div>
            ))}
            <AddButton onClick={addExp} label="Add Experience" />
          </div>}

          {tab === "projects" && <div className="space-y-5">
            {content.projects.map((p, i) => (
              <div key={p.id} className="rounded-lg p-4 space-y-3 border" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest" style={{ ...MONO, color: "#5eead4" }}>#{i + 1}</span>
                  <button onClick={() => delProj(p.id)} className="transition-colors hover:text-red-400" style={{ color: "#6b6b82" }}><Trash2 size={13} /></button>
                </div>
                <Field label="Title" value={p.title} onChange={v => upProj(p.id, "title", v)} />
                <Field label="Year" value={p.year} onChange={v => upProj(p.id, "year", v)} />
                <Field label="Description" value={p.description} onChange={v => upProj(p.id, "description", v)} multiline />
                <Field label="GitHub / Link" value={p.link} onChange={v => upProj(p.id, "link", v)} />
              </div>
            ))}
            <AddButton onClick={addProj} label="Add Project" />
          </div>}

          {tab === "skills" && <div className="space-y-5">
            {content.skills.map((s, i) => (
              <div key={s.id} className="rounded-lg p-4 space-y-3 border" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest" style={{ ...MONO, color: "#5eead4" }}>#{i + 1}</span>
                  <button onClick={() => delSkill(s.id)} className="transition-colors hover:text-red-400" style={{ color: "#6b6b82" }}><Trash2 size={13} /></button>
                </div>
                <Field label="Category Name" value={s.label} onChange={v => upSkill(s.id, "label", v)} />
                <Field label="Skills (comma-separated)" value={s.skills} onChange={v => upSkill(s.id, "skills", v)} multiline />
              </div>
            ))}
            <AddButton onClick={addSkill} label="Add Category" />
          </div>}

          {tab === "education" && <div className="space-y-5">
            {content.education.map((e, i) => (
              <div key={e.id} className="rounded-lg p-4 space-y-3 border" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest" style={{ ...MONO, color: "#5eead4" }}>#{i + 1}</span>
                  <button onClick={() => delEdu(e.id)} className="transition-colors hover:text-red-400" style={{ color: "#6b6b82" }}><Trash2 size={13} /></button>
                </div>
                <Field label="Degree" value={e.degree} onChange={v => upEdu(e.id, "degree", v)} />
                <Field label="School" value={e.school} onChange={v => upEdu(e.id, "school", v)} />
                <Field label="Location" value={e.location} onChange={v => upEdu(e.id, "location", v)} />
                <Field label="Period" value={e.period} onChange={v => upEdu(e.id, "period", v)} />
                <Field label="Notes" value={e.notes} onChange={v => upEdu(e.id, "notes", v)} multiline />
              </div>
            ))}
            <AddButton onClick={addEdu} label="Add Education" />
          </div>}

          {tab === "languages" && <div className="space-y-5">
            {content.languages.map((l, i) => (
              <div key={l.id} className="rounded-lg p-4 space-y-3 border" style={cardStyle}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest" style={{ ...MONO, color: "#5eead4" }}>#{i + 1}</span>
                  <button onClick={() => delLang(l.id)} className="transition-colors hover:text-red-400" style={{ color: "#6b6b82" }}><Trash2 size={13} /></button>
                </div>
                <Field label="Language" value={l.name} onChange={v => upLang(l.id, "name", v)} />
                <Field label="Level" value={l.level} onChange={v => upLang(l.id, "level", v)} />
              </div>
            ))}
            <AddButton onClick={addLang} label="Add Language" />
          </div>}

        </div>
      </div>
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────── */
export default function App() {
  const [content, setContent] = useState<SiteContent>(() => {
    try {
      const saved = localStorage.getItem("hazem-portfolio");
      return saved ? JSON.parse(saved) : seed;
    } catch {
      return seed;
    }
  });
  const [cmsOpen, setCmsOpen] = useState(false);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [canEditContent, setCanEditContent] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isOwnerSignedIn, setIsOwnerSignedIn] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("hazem-portfolio", JSON.stringify(content)); } catch {}
  }, [content]);

  useEffect(() => {
    fetch("https://api.counterapi.dev/v1/hazem-alabiad/portfolio/up")
      .then(r => r.json())
      .then(d => setVisitCount(d.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem("github-owner-token");
    if (!token) {
      setCanEditContent(canShowEditContent({ hostname: window.location.hostname, isSignedIn: false }));
      return;
    }

    void (async () => {
      const result = await verifyOwnerGitHubToken(token);
      if (result.ok && result.login === OWNER_GITHUB_USERNAME) {
        setIsOwnerSignedIn(true);
        setCanEditContent(true);
      } else {
        window.localStorage.removeItem("github-owner-token");
        setCanEditContent(canShowEditContent({ hostname: window.location.hostname, isSignedIn: false }));
      }
    })();
  }, []);

  useEffect(() => {
    const title = `${hero.name} • Hazem Alabiad Portfolio`;
    document.title = title;

    const description = `${hero.bio.replace(/\s+/g, " ").trim().slice(0, 155)}${hero.bio.length > 155 ? "…" : ""}`;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute("content", description);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", title);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute("content", description);

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute("content", title);

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute("content", description);
  }, [hero.bio, hero.name]);

  const handleReset = () => {
    if (confirm("Reset all content to defaults?")) {
      setContent(seed);
      localStorage.removeItem("hazem-portfolio");
    }
  };

  const handleSignIn = async () => {
    const token = window.prompt("Paste your GitHub personal access token");
    if (!token) return;

    setIsSigningIn(true);
    setSignInError(null);
    const result = await verifyOwnerGitHubToken(token);
    if (result.ok && result.login === OWNER_GITHUB_USERNAME) {
      window.localStorage.setItem("github-owner-token", token);
      setIsOwnerSignedIn(true);
      setCanEditContent(true);
    } else {
      setSignInError("Only the portfolio owner can edit this content.");
    }
    setIsSigningIn(false);
  };

  const handleSignOut = () => {
    window.localStorage.removeItem("github-owner-token");
    setIsOwnerSignedIn(false);
    setCanEditContent(canShowEditContent({ hostname: window.location.hostname, isSignedIn: false }));
  };

  const { hero, experience, projects, skills, education, languages } = content;

  return (
    <div className="min-h-screen antialiased" style={{ background: "#09090f", color: "#d4d4e0" }}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-4 border-b"
        style={{ background: "rgba(9,9,15,0.88)", backdropFilter: "blur(16px)", borderColor: "oklch(1 0 0 / 0.06)" }}>
        <span className="text-sm" style={{ ...DISPLAY, color: "#5eead4" }}>{hero.name}</span>
        <div className="hidden md:flex items-center gap-8">
          {[["Education", "education"], ["Experience", "experience"], ["Research", "projects"], ["Skills", "skills"]].map(([label, id]) => (
            <a key={id} href={`#${id}`} className="text-[11px] uppercase tracking-[0.2em] transition-colors hover:text-[#5eead4]"
              style={{ ...MONO, color: "#6b6b82" }}>{label}</a>
          ))}
        </div>
        <a href={`mailto:${hero.email}`} className="hidden md:block text-xs transition-colors hover:text-[#d4d4e0]"
          style={{ ...MONO, color: "#5eead4" }}>{hero.email}</a>
      </nav>

      <main className="max-w-4xl mx-auto px-6 md:px-12 pt-36 pb-28">

        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="mb-32">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.3em] mb-5" style={{ ...MONO, color: "#5eead4" }}>
                Available for opportunities
              </p>
              <h1 className="leading-[0.92] tracking-tight mb-5" style={{ ...DISPLAY, color: "#eeeef5", fontSize: "clamp(2.8rem,7vw,5rem)" }}>
                {hero.name}
              </h1>
              <div className="flex flex-wrap gap-2 mb-6">
                {["TypeScript", "React", "Node.js", "Python", "NLP", "LLMs"].map(skill => (
                  <span key={skill} className="text-[12px] px-2.5 py-1 rounded-md border" style={{ ...MONO, background: "rgba(94,234,212,0.05)", borderColor: "rgba(94,234,212,0.18)", color: "#5eead4" }}>
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mb-5 max-w-[52ch] space-y-3">
                {hero.bio.split("\n\n").map((para, i) => (
                  <p key={i} className="text-[17px] leading-[1.9] tracking-[0.015em]" style={{ color: "#d8d8ea", fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>{para}</p>
                ))}
              </div>


              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <a href={`mailto:${hero.email}`}
                  className="flex items-center gap-2 px-4 py-2 rounded border text-sm font-medium transition-all hover:scale-[1.02]"
                  style={{ background: "#5eead4", color: "#09090f", border: "none" }}>
                  <Mail size={14} /> Get in touch
                </a>
                <a href={resolveCvHref(hero, cvAsset)} download={resolveCvName(hero, "Hazem-Alabiad-CV.pdf")}
                  className="flex items-center gap-2 px-4 py-2 rounded border text-sm transition-all hover:border-white/25 hover:text-[#d4d4e0]"
                  style={{ borderColor: "oklch(1 0 0 / 0.12)", color: "#9494a8" }}>
                  <Download size={14} /> Download CV
                </a>
              </div>

              {/* Social links */}
              <div className="flex flex-wrap items-center gap-6">
                <SocialLink href={`https://${hero.github}`} icon={<Github size={14} />} label="GitHub" />
                <SocialLink href={`https://${hero.linkedin}`} icon={<Linkedin size={14} />} label="LinkedIn" />
                <span className="flex items-center gap-1.5 text-sm" style={{ color: "#6b6b82" }}>
                  <MapPin size={14} /> {hero.location}
                </span>
              </div>
            </div>

            {/* Photo */}
            <div className="flex-shrink-0 self-start md:mt-8">
              <div className="relative w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden"
                style={{ boxShadow: "0 0 0 1.5px rgba(94,234,212,0.35), 0 0 32px rgba(94,234,212,0.08)" }}>
                <img
                  src={profilePhoto}
                  alt={hero.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "center 4%", filter: "brightness(0.92) contrast(1.04) saturate(0.88)" }}
                />
                <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at center, transparent 55%, rgba(9,9,15,0.5) 100%)" }} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Education ────────────────────────────────────── */}
        <section className="mb-28">
          <SectionHeader label="Education" id="education" />
          <div className="space-y-10">
            {education.map(edu => (
              <div key={edu.id} className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div>
                  <h3 className="font-medium" style={{ color: "#eeeef5" }}>{edu.degree}</h3>
                  <p className="text-sm mt-0.5">
                    <span style={{ color: "#5eead4", opacity: 0.8 }}>{edu.school}</span>
                    <span style={{ color: "#6b6b82" }}> · {edu.location}</span>
                  </p>
                  {edu.notes && <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "#8f8fa8" }}>{edu.notes}</p>}
                </div>
                <span className="text-[11px] whitespace-nowrap shrink-0 mt-1" style={{ ...MONO, color: "#6b6b82" }}>{edu.period}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Experience ───────────────────────────────────── */}
        <section className="mb-28">
          <SectionHeader label="Experience" id="experience" />
          <div>
            {groupByCompany(experience).map((group, gi, arr) => (
              <div key={group.company + gi} className="relative pl-7 pb-12 last:pb-0">
                {/* Timeline dot */}
                <div className="absolute left-0 top-[8px] w-2 h-2 rounded-full" style={{ background: "#5eead4", opacity: 0.35 }} />
                {gi < arr.length - 1 && (
                  <div className="absolute left-[3px] top-5 bottom-0 w-px" style={{ background: "oklch(1 0 0 / 0.07)" }} />
                )}

                {group.roles.length === 1 ? (
                  /* ── Single role: existing flat layout ── */
                  <>
                    <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 mb-3">
                      <div>
                        <h3 className="font-medium text-[15px]" style={{ color: "#eeeef5" }}>{group.roles[0].role}</h3>
                        <p className="text-[13.5px] mt-0.5">
                          <span style={{ color: "#5eead4", opacity: 0.9 }}>{group.company}</span>
                          <span style={{ color: "#707088" }}> · {group.location}</span>
                        </p>
                      </div>
                      <span className="text-[11px] whitespace-nowrap shrink-0" style={{ ...MONO, color: "#6b6b82" }}>{group.roles[0].period}</span>
                    </div>
                    {group.roles[0].bullets.filter(Boolean).length > 0 && (
                      <ul className="space-y-1.5">
                        {group.roles[0].bullets.filter(Boolean).map((b, bi) => (
                          <li key={bi} className="text-[14px] leading-relaxed flex gap-2.5" style={{ color: "#ababc0" }}>
                            <span className="mt-[3px] shrink-0" style={{ color: "#5eead4", opacity: 0.3 }}>—</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  /* ── Multiple roles: company header + nested roles ── */
                  <>
                    <div className="mb-4">
                      <h3 className="font-medium text-[15px]" style={{ color: "#5eead4" }}>{group.company}</h3>
                      <p className="text-[13px] mt-0.5" style={{ color: "#707088" }}>{group.location}</p>
                    </div>
                    <div className="space-y-6 border-l pl-5" style={{ borderColor: "oklch(1 0 0 / 0.07)" }}>
                      {group.roles.map((role) => (
                        <div key={role.id}>
                          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-1 mb-2">
                            <span className="font-medium text-[14px]" style={{ color: "#d8d8ec" }}>{role.role}</span>
                            <span className="text-[11px] whitespace-nowrap shrink-0" style={{ ...MONO, color: "#6b6b82" }}>{role.period}</span>
                          </div>
                          {role.bullets.filter(Boolean).length > 0 && (
                            <ul className="space-y-1.5">
                              {role.bullets.filter(Boolean).map((b, bi) => (
                                <li key={bi} className="text-[14px] leading-relaxed flex gap-2.5" style={{ color: "#ababc0" }}>
                                  <span className="mt-[3px] shrink-0" style={{ color: "#5eead4", opacity: 0.3 }}>—</span>
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Research & Projects ───────────────────────────── */}
        <section className="mb-28">
          <SectionHeader label="Research &amp; Projects" id="projects" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(proj => (
              <a key={proj.id}
                href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                target="_blank" rel="noopener noreferrer"
                className="group block rounded-xl p-5 border transition-all"
                style={{ background: "#111119", borderColor: "oklch(1 0 0 / 0.08)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(94,234,212,0.22)"; (e.currentTarget as HTMLElement).style.background = "#12121f"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "oklch(1 0 0 / 0.08)"; (e.currentTarget as HTMLElement).style.background = "#111119"; }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-[11px]" style={{ ...MONO, color: "#5eead4", opacity: 0.6 }}>{proj.year}</span>
                  <ArrowUpRight size={14} style={{ color: "#6b6b82" }} />
                </div>
                <h3 className="font-medium mb-2 leading-snug" style={{ color: "#eeeef5" }}>{proj.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "#8f8fa8" }}>{proj.description}</p>
              </a>
            ))}
          </div>
        </section>

        {/* ── Skills ───────────────────────────────────────── */}
        <section className="mb-28">
          <SectionHeader label="Skills" id="skills" />
          <div className="space-y-7">
            {skills.map(sg => (
              <div key={sg.id} className="flex flex-col md:flex-row gap-3 md:gap-6">
                <span className="text-[11px] uppercase tracking-[0.2em] shrink-0 pt-1 w-28" style={{ ...MONO, color: "#5eead4", opacity: 0.65 }}>
                  {sg.label}
                </span>
                <div className="flex flex-wrap gap-2">
                  {sg.skills.split(",").map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="text-[13px] px-3 py-1.5 rounded border cursor-default"
                      style={{ background: "#111119", borderColor: "oklch(1 0 0 / 0.09)", color: "#a0a0b8" }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Languages ────────────────────────────────────── */}
        {languages.length > 0 && (
          <section className="mb-28">
            <SectionHeader label="Languages" id="languages" />
            <div className="flex flex-wrap gap-4">
              {languages.map(lang => (
                <div key={lang.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border"
                  style={{ background: "#111119", borderColor: "oklch(1 0 0 / 0.08)" }}>
                  <span className="font-medium text-sm" style={{ color: "#eeeef5" }}>{lang.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ ...MONO, background: "rgba(94,234,212,0.08)", color: "#5eead4" }}>
                    {lang.level}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t px-6 md:px-12 py-8" style={{ borderColor: "oklch(1 0 0 / 0.06)" }}>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs" style={{ ...MONO, color: "#6b6b82" }}>© 2026 {hero.name}</p>
            {visitCount !== null && (
              <span className="flex items-center gap-1.5 text-xs" style={{ ...MONO, color: "#4a4a60" }}>
                <span className="w-1 h-1 rounded-full inline-block" style={{ background: "#5eead4", opacity: 0.5 }} />
                {visitCount.toLocaleString()} visits
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <SocialLink href={`https://${hero.github}`} icon={<Github size={13} />} label="GitHub" />
            <SocialLink href={`https://${hero.linkedin}`} icon={<Linkedin size={13} />} label="LinkedIn" />
            <SocialLink href={`mailto:${hero.email}`} icon={<Mail size={13} />} label="Email" />
          </div>
        </div>
      </footer>

      {/* CMS */}
      {cmsOpen && (
        <ContentManager content={content} onChange={setContent} onClose={() => setCmsOpen(false)} onReset={handleReset} />
      )}

      {/* Floating Edit Button */}
      {canEditContent && (
        <button onClick={() => setCmsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-[12px] font-medium transition-all hover:scale-105 active:scale-95"
          style={{ ...MONO, background: "#5eead4", color: "#09090f", boxShadow: "0 0 24px rgba(94,234,212,0.2)" }}>
          <Edit3 size={13} /> Edit Content
        </button>
      )}

      {!isOwnerSignedIn && !canEditContent && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-full border px-4 py-2.5 text-[12px]" style={{ ...MONO, background: "#111119", borderColor: "oklch(1 0 0 / 0.12)", color: "#d4d4e0" }}>
          <span>Owner access only</span>
          <button onClick={handleSignIn} disabled={isSigningIn} className="rounded-full bg-[#5eead4] px-3 py-1 text-[11px] font-medium text-[#09090f] disabled:opacity-60">
            {isSigningIn ? "Checking…" : "Sign in"}
          </button>
        </div>
      )}

      {isOwnerSignedIn && (
        <button onClick={handleSignOut} className="fixed bottom-6 left-6 z-40 rounded-full border px-3 py-2 text-[11px]" style={{ ...MONO, background: "#111119", borderColor: "oklch(1 0 0 / 0.12)", color: "#d4d4e0" }}>
          Sign out
        </button>
      )}

      {signInError && (
        <div className="fixed bottom-20 right-6 z-40 max-w-xs rounded-lg border px-3 py-2 text-[11px]" style={{ ...MONO, background: "#111119", borderColor: "oklch(1 0 0 / 0.14)", color: "#fda4af" }}>
          {signInError}
        </div>
      )}
    </div>
  );
}
