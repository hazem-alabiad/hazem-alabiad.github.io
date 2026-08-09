// ─── CMS content store ───────────────────────────────────────────────────────
// Structured portfolio content persisted to localStorage. The live page merges
// these overrides on top of the built-in defaults, so editing in the CMS page
// updates the whole CV without rebuilding.

export const CMS_STORE_KEY = "hazem-portfolio-cms-settings";

export interface CmsExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  bullets: string[];
  tags: string[];
  current: boolean;
}

export interface CmsEducation {
  id: string;
  degree: string;
  school: string;
  location: string;
  period: string;
  detail: string;
  badges: string[];
  current: boolean;
}

export interface CmsProject {
  id: string;
  name: string;
  desc: string;
  tags: string[];
  status: string;
  year: string;
  link: string;
}

export interface CmsSkill {
  id: string;
  label: string;
  level: number;
  cat: "stack" | "ai";
}

export interface CmsLanguage {
  id: string;
  name: string;
  level: string;
}

export interface CmsContactLink {
  id: string;
  label: string;
  value: string;
  href: string;
}

export interface CmsContent {
  heroTagline: string;
  bio1: string;
  bio2: string;
  factLocation: string;
  factDegree: string;
  factCurrent: string;
  factAvailable: string;
  contactIntro: string;
  footerLine: string;
  photo: string | null;      // data URL (image)
  cvName: string;
  cvDataUrl: string | null;  // data URL (pdf)
  experience: CmsExperience[];
  education: CmsEducation[];
  projects: CmsProject[];
  skills: CmsSkill[];
  languages: CmsLanguage[];
  links: CmsContactLink[];
  stats: { to: number; suffix: string; label: string }[];
}

export const DEFAULT_CONTENT: CmsContent = {
  heroTagline:
    "Software Engineer with 6+ years of experience, M.A. student in Computational Linguistics at Tübingen. Bridging production-grade full-stack engineering with AI, NLP, and LLM research.",
  bio1:
    "Software Engineer with 6+ years of experience building production-ready systems and pixel-perfect UIs with React, Next.js, TypeScript, and modern tooling. Led cross-functional teams, improved developer experience, and delivered design-driven applications at scale.",
  bio2:
    "Currently pursuing an M.A. in Computational Linguistics at the University of Tübingen (Student Assistant at IWM & the Autonomous Learning Lab). Research focus: AI, ML, LLMs, NLP, and Cognitive Science. Open to Working Student & internship roles in NLP, AI/ML, and LLMs — Tübingen, Stuttgart, or remote.",
  factLocation: "Tübingen, Germany",
  factDegree: "M.A. Computational Linguistics",
  factCurrent: "Student Asst. · IWM & Auto. Learning Lab",
  factAvailable: "NLP / AI / Full-Stack",
  contactIntro:
    "Open to NLP/AI research roles, full-stack engineering positions, and research collaborations. Based in Tübingen, open to remote worldwide.",
  footerLine: "© 2026 HAZEM ALABIAD. TÜBINGEN, GERMANY.",
  photo: null,
  cvDataUrl: null,
  experience: [
    { id: "e1", role: "Research Assistant", company: "University of Tübingen", location: "Tübingen", period: "Jul 2026 – Present", bullets: ["LLM-based AI tutor for lectures — conversational agent for student support and adaptive learning."], tags: ["LLMs", "NLP", "Research"], current: true },
    { id: "e2", role: "Research Assistant", company: "Leibniz-Institut für Wissensmedien (IWM)", location: "Tübingen", period: "Jul 2026 – Present", bullets: ["Social media (TikTok) impact research — studying algorithmic influence on cognition and learning."], tags: ["Research", "Social Media", "Data Science"], current: true },
    { id: "e3", role: "Software Engineer (Working Student)", company: "IBM", location: "Böblingen", period: "Jun 2024 – Apr 2026", bullets: ["Built production React UI for IBM's Data Quality platform (1M+ enterprise users) using IBM Carbon and TypeScript; maintained 300+ regression and E2E tests with Puppeteer and Cypress.", "Drove a11y improvements (ARIA, screen reader, keyboard nav); enforced code style via global ESLint/Prettier."], tags: ["React", "TypeScript", "IBM Carbon", "Cypress", "Puppeteer"], current: false },
    { id: "e4", role: "Frontend Developer", company: "Getir", location: "Ankara", period: "Dec 2022 – Mar 2024", bullets: ["Maintained GetirJobs (2.2M+ users); led two greenfield React/TypeScript projects from scratch.", "Boosted dev server speed 3× via Vite migration; raised test coverage to 70% with Playwright and Jest."], tags: ["React", "TypeScript", "Vite", "Playwright", "Agile"], current: false },
    { id: "e5", role: "Engineering Lead", company: "Arianna Suisse Sa", location: "Remote (Switzerland)", period: "Jun 2022 – Nov 2022", bullets: ["Led 4 developers + 1 designer; architected scalable GraphQL API with Apollo Federation and MySQL.", "Managed technical hiring for 50+ candidates; onboarded 4 team members."], tags: ["GraphQL", "Apollo Federation", "MySQL", "Team Lead"], current: false },
    { id: "e6", role: "Full-Stack Developer", company: "Arianna Suisse Sa", location: "Remote (Switzerland)", period: "May 2021 – Jun 2022", bullets: ["Built custom Elasticsearch search engine; enabled real-time multi-user editing via WebSocket.", "~90% Jest test coverage across React components and GraphQL server."], tags: ["React", "GraphQL", "Elasticsearch", "WebSocket", "Node.js"], current: false },
    { id: "e7", role: "Freelance Software Developer", company: "Remote (US)", location: "", period: "Feb 2020 – Feb 2021", bullets: ["Built pixel-perfect React UIs and integrated third-party APIs for 3 international clients.", "Developed Python web crawlers publishing to RabbitMQ queues for backend AI pipelines."], tags: ["React", "Python", "RabbitMQ", "API Integration"], current: false },
    { id: "e8", role: "QA Automation Engineer", company: "Bayzat", location: "Remote (UAE)", period: "Jan 2019 – Nov 2019", bullets: ["Built Cypress regression and E2E suites from scratch for Bayzat's Time-off feature, covering core HR workflows."], tags: ["Cypress", "QA Automation", "E2E Testing"], current: false },
  ],
  education: [
    {
      id: "edu-1",
      degree: "M.A. in Computational Linguistics",
      school: "University of Tübingen",
      location: "Tübingen",
      period: "Oct 2023 – Present",
      detail:
        "Focus: Corpus Linguistics, Large Language Models (LLMs), Cognitive Science, NLP and Data Science.",
      badges: ["NLP", "LLMs", "Cognitive Science"],
      current: true,
    },
    {
      id: "edu-2",
      degree: "B.Sc. in Computer Engineering",
      school: "Hacettepe University",
      location: "Ankara",
      period: "Sep 2015 – Jun 2019",
      detail:
        "Honor student, top 10% of the class (GPA 3.41). Received the YTB Scholarship for high performance.",
      badges: ["Honor Student", "Top 10%"],
      current: false,
    },
  ],
  projects: [
    { id: "p1", name: "Multiword Expressions in Arabic", desc: "LLM extraction of Arabic verbal multiword expressions for computational linguistics research. Exploring cross-lingual transfer for low-resource MWE detection.", tags: ["LLMs", "NLP", "Arabic", "Python"], status: "RESEARCH", year: "2026", link: "https://github.com/hazem-alabiad" },
    { id: "p2", name: "Content Rating System", desc: "NLP/DL age-appropriateness classifier for books. Deep learning pipeline with multi-label text classification and custom preprocessing.", tags: ["NLP", "Deep Learning", "Python", "TensorFlow"], status: "COMPLETE", year: "2022", link: "https://github.com/hazem-alabiad" },
    { id: "p3", name: "Taxi Tip Estimator", desc: "ML/DL taxi tip predictor trained on NYC trip data. Feature engineering pipeline with regression models and neural network ensemble.", tags: ["ML", "Deep Learning", "Python", "Pandas"], status: "COMPLETE", year: "2021", link: "https://github.com/hazem-alabiad" },
    { id: "p4", name: "Automated Essay Grading", desc: "LSTM-based automated essay grading pipeline with multi-trait scoring, NLP preprocessing, and attention mechanisms for feature extraction.", tags: ["LSTM", "NLP", "Python", "TensorFlow"], status: "COMPLETE", year: "2019", link: "https://github.com/hazem-alabiad" },
  ],
  skills: [
    { id: "s1", label: "React.js / Next.js / TypeScript", level: 97, cat: "stack" },
    { id: "s2", label: "GraphQL / Apollo Federation", level: 88, cat: "stack" },
    { id: "s3", label: "Node.js / REST APIs / WebSocket", level: 85, cat: "stack" },
    { id: "s4", label: "Testing (Jest / Cypress / Playwright)", level: 90, cat: "stack" },
    { id: "s5", label: "Docker / DevOps / Linux", level: 76, cat: "stack" },
    { id: "s6", label: "Elasticsearch / MySQL", level: 80, cat: "stack" },
    { id: "s7", label: "Python / LLMs / NLP", level: 88, cat: "ai" },
    { id: "s8", label: "TensorFlow / Deep Learning", level: 80, cat: "ai" },
    { id: "s9", label: "Transfer Learning / Fine-tuning", level: 82, cat: "ai" },
    { id: "s10", label: "Corpus Linguistics", level: 83, cat: "ai" },
    { id: "s11", label: "Data Engineering / Pandas / R", level: 78, cat: "ai" },
    { id: "s12", label: "Machine Learning Pipelines", level: 85, cat: "ai" },
  ],
  languages: [
    { id: "l1", name: "Arabic", level: "Native" },
    { id: "l2", name: "English", level: "Proficient" },
    { id: "l3", name: "Turkish", level: "Proficient" },
    { id: "l4", name: "German", level: "Beginner" },
  ],
  links: [
    { id: "c1", label: "EMAIL", value: "hazem.alabiad@icloud.com", href: "mailto:hazem.alabiad@icloud.com" },
    { id: "c2", label: "GITHUB", value: "github.com/hazem-alabiad", href: "https://github.com/hazem-alabiad" },
    { id: "c3", label: "LINKEDIN", value: "linkedin.com/in/hazemalabiad", href: "https://linkedin.com/in/hazemalabiad" },
    { id: "c4", label: "SCHOLAR", value: "scholar.google.com/hazem", href: "https://scholar.google.com/hazem" },
  ],
  stats: [
    { to: 6, suffix: "+", label: "Years Experience" },
    { to: 0, suffix: "2.2M+", label: "Users Served" },
    { to: 8, suffix: "", label: "Companies" },
    { to: 4, suffix: "", label: "Languages Spoken" },
  ],
};

export function loadContent(): CmsContent {
  try {
    const raw = localStorage.getItem(CMS_STORE_KEY);
    if (!raw) return structuredClone(DEFAULT_CONTENT);
    const parsed = JSON.parse(raw) as Partial<CmsContent>;
    return { ...structuredClone(DEFAULT_CONTENT), ...parsed };
  } catch {
    return structuredClone(DEFAULT_CONTENT);
  }
}

export function saveContent(content: CmsContent) {
  localStorage.setItem(CMS_STORE_KEY, JSON.stringify(content));
}

export function resetContent() {
  localStorage.removeItem(CMS_STORE_KEY);
}

export function uid() {
  return Math.random().toString(36).slice(2, 8);
}