// ─── CMS content store ───────────────────────────────────────────────────────
// Structured portfolio content persisted to localStorage. The live page merges
// these overrides on top of the built-in defaults, so editing in the CMS page
// updates the whole CV without rebuilding.

export const CMS_STORE_KEY = "hazem-portfolio-cms-settings-v4";

export interface CmsExperience {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  start?: { m: number; y: number } | null;
  end?: { m: number; y: number } | null;
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
  focus: string[];
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
    "<strong>Computational Linguist &amp; Full-Stack Engineer.</strong> Shipped to <strong>3M+ people</strong> — IBM Data Quality (1M+ enterprise users), GetirJobs (2.2M+), 3× faster builds. Now on an <strong>M.A. in Computational Linguistics</strong> at Tübingen, building an LLM-based AI tutor. <strong>Open to NLP/AI and full-stack roles.</strong>",
  bio1: "",
  bio2:
    "Open to roles in NLP, AI/LLM engineering, and full-stack software engineering — Tübingen, Stuttgart, or remote.",
  factLocation: "Tübingen, Germany",
  factDegree: "M.A. Computational Linguistics",
  factCurrent: "Student Asst. · IWM & Auto. Learning Lab",
  factAvailable: "NLP / AI / Full-Stack",
  contactIntro:
    "Open to roles in NLP, AI/LLM engineering, and full-stack software engineering — reach out directly or find me on any of the links below.",
  footerLine: "© HAZEM ALABIAD — TÜBINGEN, GERMANY",
  photo: null,
  cvName: "Hazem-Alabiad-CV.pdf",
  cvDataUrl: null,
experience: [
    { id: "e1", role: "Research Assistant", company: "University of Tübingen", location: "Autonomous Learning Lab · Tübingen", period: "Jul 2026 – Present", bullets: ["Building an LLM-based AI tutor for university lectures — a conversational agent for student support and adaptive learning."], tags: ["LLMs", "NLP", "Research"], current: true },
    { id: "e2", role: "Research Assistant", company: "Leibniz-Institut für Wissensmedien (IWM)", location: "Tübingen", period: "Jul 2026 – Present", bullets: ["Cognitive social science & AI research — analyzing algorithmic influence on learning, cognition, and behavior."], tags: ["Cognitive Science", "AI", "Research"], current: true },
    { id: "e3", role: "Software Engineer, Working Student", company: "IBM", location: "Böblingen", period: "Jun 2024 – Apr 2026", bullets: ["Built production React UI for IBM's Data Quality platform (1M+ enterprise users) using IBM Carbon and TypeScript; maintained 300+ regression and E2E tests with Puppeteer and Cypress.", "Drove accessibility improvements (ARIA, screen reader, keyboard nav); upgraded Node.js packages and enforced a consistent code style via a global ESLint/Prettier config."], tags: ["React", "TypeScript", "IBM Carbon", "Cypress", "Puppeteer"], current: false },
    { id: "e4", role: "Frontend Developer", company: "Getir", location: "Ankara", period: "Dec 2022 – Mar 2024", bullets: ["Maintained GetirJobs (2.2M+ users); led two greenfield React/TypeScript projects from scratch; boosted dev-server speed 3× via a Vite migration.", "Established a code review and testing culture, raising component test coverage to 70% with Playwright and Jest; integrated REST APIs in a cross-functional team."], tags: ["React", "TypeScript", "Vite", "Playwright", "Jest"], current: false },
    { id: "e5", role: "Engineering Lead", company: "Arianna Suisse SA", location: "Remote, Switzerland", period: "Jun 2022 – Nov 2022", bullets: ["Led a team of 4 developers and 1 designer, delivering projects on time and within budget; architected a scalable GraphQL API with Apollo Federation and a MySQL schema.", "Mentored developers while managing technical hiring for 50+ candidates; onboarded 4 new team members."], tags: ["GraphQL", "Apollo Federation", "MySQL", "Leadership"], current: false },
    { id: "e6", role: "Full-Stack Developer", company: "Arianna Suisse SA", location: "Remote, Switzerland", period: "May 2021 – Jun 2022", bullets: ["Built reusable React components from Figma designs; architected and managed a GraphQL server with Apollo Federation and MySQL, reaching ~90% Jest coverage.", "Built a custom Elasticsearch-based search engine and enabled real-time multi-user editing via WebSocket."], tags: ["React", "GraphQL", "Elasticsearch", "WebSocket", "Node.js"], current: false },
    { id: "e7", role: "Freelance Software Developer", company: "Remote", location: "United States clients", period: "Feb 2020 – Feb 2021", bullets: ["Built pixel-perfect React UIs and integrated third-party APIs for 3 international clients.", "Developed Python web crawlers publishing scraped data to RabbitMQ queues for backend AI pipelines."], tags: ["React", "Python", "RabbitMQ", "API Integration"], current: false },
    { id: "e8", role: "QA Automation Engineer", company: "Bayzat", location: "Remote, UAE", period: "Jan 2019 – Nov 2019", bullets: ["Built manual and automated test suites for Bayzat's Time-off feature, covering core HR workflows used by thousands across the UAE.", "Developed Cypress regression and E2E suites from scratch, reducing manual-testing overhead and catching regressions before release."], tags: ["Cypress", "QA Automation", "E2E Testing"], current: false },
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
      focus: ["NLP", "LLMs", "Cognitive Science"],
      badges: [],
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
      focus: [],
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
    { id: "s1", label: "React.js / Next.js / TypeScript / JavaScript (ES6+)", cat: "stack" },
    { id: "s2", label: "GraphQL / Apollo Federation", cat: "stack" },
    { id: "s3", label: "Node.js / WebSocket", cat: "stack" },
    { id: "s4", label: "Redux", cat: "stack" },
    { id: "s5", label: "Elasticsearch", cat: "stack" },
    { id: "s6", label: "Python", cat: "ai" },
    { id: "s7", label: "LLMs / NLP", cat: "ai" },
    { id: "s8", label: "TensorFlow / Transfer Learning", cat: "ai" },
    { id: "s9", label: "Data Engineering", cat: "ai" },
    { id: "s10", label: "R / Pandas", cat: "ai" },
    { id: "s11", label: "Machine Learning Pipelines", cat: "ai" },
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
    { id: "c4", label: "SCHOLAR", value: "scholar.google.com/hazem", href: "https://scholar.google.com/citations?user=UYsJxDYAAAAJ&hl=en" },
  ],
  stats: [
    { to: 6, suffix: "+", label: "Years engineering" },
    { to: 0, suffix: "1M+", label: "Users on shipped platforms" },
    { to: 2, suffix: "", label: "Active research appointments" },
    { to: 4, suffix: "", label: "Languages spoken" },
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