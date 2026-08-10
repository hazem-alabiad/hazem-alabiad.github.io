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
  impact: string;
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
    "Software Engineer with 6+ years shipping production-ready, maintainable systems and pixel-perfect UIs in React, Next.js, and TypeScript. Now M.A. Computational Linguistics @ Uni Tübingen and research assistant on an LLM AI-Tutor and social-media impact studies — bridging engineering with AI, NLP, and Cognitive Science.",
  bio1: "",
  bio2:
    "Open to Working Student & internship roles in NLP, AI/ML, and LLMs — Tübingen, Stuttgart, or remote.",
  factLocation: "Tübingen, Germany",
  factDegree: "M.A. Computational Linguistics",
  factCurrent: "Student Asst. · IWM & Auto. Learning Lab",
  factAvailable: "NLP / AI / Full-Stack",
  contactIntro:
    "Questions, collaborations, or a role in mind? I reply within a day — reach me directly or transmit a message below.",
  footerLine: "© 2026 HAZEM ALABIAD. TÜBINGEN, GERMANY.",
  photo: null,
  cvDataUrl: null,
experience: [
    { id: "e1", role: "Research Assistant — LLM AI-Tutor", company: "University of Tübingen · Autonomous Learning Lab", location: "Tübingen", period: "Jul 2026 – Present", bullets: ["LLM-based AI tutor for lectures — building a conversational agent for student support and adaptive learning."], tags: ["LLMs", "NLP", "Research"], current: true },
    { id: "e2", role: "Research Assistant — Social-Media & Learning", company: "Leibniz-Institut für Wissensmedien (IWM)", location: "Tübingen", period: "Jul 2026 – Present", bullets: ["Social media (TikTok) impact research — analyzing algorithmic influence on cognition, learning, and behavior."], tags: ["Research", "Social Media", "Data Science"], current: true },
    { id: "e3", role: "Software Engineer (Working Student)", company: "IBM", location: "Böblingen", period: "Jun 2024 – Apr 2026", bullets: ["Built production React UI for IBM's Data Quality platform (1M+ enterprise users) with IBM Carbon + TypeScript; maintained 300+ regression tests and E2E suites in Puppeteer and Cypress.", "Drove a11y improvements (ARIA, screen reader, keyboard nav); upgraded Node.js packages and enforced global ESLint/Prettier code style."], tags: ["React", "TypeScript", "IBM Carbon", "Cypress", "Puppeteer"], current: false },
    { id: "e4", role: "Frontend Developer", company: "Getir", location: "Ankara", period: "Dec 2022 – Mar 2024", bullets: ["Maintained GetirJobs (2.2M+ users); led two greenfield React/TypeScript projects from scratch.", "Cut dev-server boot 3× with Vite migration; raised component test coverage to 70% via Playwright + Jest.", "Established code-review & testing culture; integrated REST APIs in a cross-functional Agile/Scrum team."], tags: ["React", "TypeScript", "Vite", "Playwright", "Jest"], current: false },
    { id: "e5", role: "Engineering Lead", company: "Arianna Suisse Sa", location: "Remote (Switzerland)", period: "Jun 2022 – Nov 2022", bullets: ["Led 4 developers + 1 designer, shipping on time and within budget; architected a scalable GraphQL API with Apollo Federation and a MySQL schema.", "Mentored engineers and ran technical hiring for 50+ candidates; onboarded 4 team members."], tags: ["GraphQL", "Apollo Federation", "MySQL", "Leadership"], current: false },
    { id: "e6", role: "Full-Stack Developer", company: "Arianna Suisse Sa", location: "Remote (Switzerland)", period: "May 2021 – Jun 2022", bullets: ["Built reusable React components from Figma; architected a GraphQL server (Apollo Federation) + MySQL with ~90% Jest coverage.", "Built a custom Elasticsearch search engine and real-time multi-user editing over WebSocket."], tags: ["React", "GraphQL", "Elasticsearch", "WebSocket", "Node.js"], current: false },
    { id: "e7", role: "Freelance Software Developer", company: "Remote (US)", location: "", period: "Feb 2020 – Feb 2021", bullets: ["Built pixel-perfect React UIs and integrated third-party APIs for 3 international clients.", "Developed Python web crawlers feeding RabbitMQ-backed AI pipelines."], tags: ["React", "Python", "RabbitMQ", "API Integration"], current: false },
    { id: "e8", role: "QA Automation Engineer", company: "Bayzat", location: "Remote (UAE)", period: "Jan 2019 – Nov 2019", bullets: ["Built manual + automated suites for Bayzat's Time-off feature, covering core HR workflows used across the UAE.", "Created Cypress regression and E2E suites from scratch, cutting manual-testing overhead and catching regressions pre-release."], tags: ["Cypress", "QA Automation", "E2E Testing"], current: false },
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
    { id: "p1", name: "Multiword Expressions in Arabic", desc: "LLM extraction of Arabic verbal multiword expressions for computational linguistics research. Exploring cross-lingual transfer for low-resource MWE detection.", impact: "Aims to improve MWE coverage for low-resource Arabic NLP tasks.", tags: ["LLMs", "NLP", "Arabic", "Python"], status: "RESEARCH", year: "2026", link: "https://github.com/hazem-alabiad" },
    { id: "p2", name: "Content Rating System", desc: "NLP/DL age-appropriateness classifier for books. Deep learning pipeline with multi-label text classification and custom preprocessing.", impact: "Automates a previously manual age-rating review workflow.", tags: ["NLP", "Deep Learning", "Python", "TensorFlow"], status: "COMPLETE", year: "2022", link: "https://github.com/hazem-alabiad" },
    { id: "p3", name: "Taxi Tip Estimator", desc: "ML/DL taxi tip predictor trained on NYC trip data. Feature engineering pipeline with regression models and neural network ensemble.", impact: "Predicts trip tips on the ~1.5M-row NYC dataset with ensemble DL.", tags: ["ML", "Deep Learning", "Python", "Pandas"], status: "COMPLETE", year: "2021", link: "https://github.com/hazem-alabiad" },
    { id: "p4", name: "Automated Essay Grading", desc: "LSTM-based automated essay grading pipeline with multi-trait scoring, NLP preprocessing, and attention mechanisms for feature extraction.", impact: "Grades essays across multiple traits in one automated pass.", tags: ["LSTM", "NLP", "Python", "TensorFlow"], status: "COMPLETE", year: "2019", link: "https://github.com/hazem-alabiad" },
  ],
  skills: [
    { id: "s1", label: "React.js / Next.js / TypeScript / JavaScript (ES6+)", level: 98, cat: "stack" },
    { id: "s2", label: "GraphQL / Apollo Federation", level: 90, cat: "stack" },
    { id: "s3", label: "Node.js / WebSocket", level: 87, cat: "stack" },
    { id: "s4", label: "Redux", level: 86, cat: "stack" },
    { id: "s5", label: "Elasticsearch", level: 82, cat: "stack" },
    { id: "s6", label: "Python", level: 96, cat: "ai" },
    { id: "s7", label: "LLMs / NLP", level: 93, cat: "ai" },
    { id: "s8", label: "TensorFlow / Transfer Learning", level: 86, cat: "ai" },
    { id: "s9", label: "Data Engineering", level: 84, cat: "ai" },
    { id: "s10", label: "R / Pandas", level: 82, cat: "ai" },
    { id: "s11", label: "Machine Learning Pipelines", level: 85, cat: "ai" },
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
    { id: "c4", label: "SCHOLAR", value: "scholar.google.com", href: "https://scholar.google.com/citations?hl=en&user=UYsJxDYAAAAJ" },
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