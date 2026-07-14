import { useState, useRef, useEffect } from "react";
import {
  X, Upload, CheckCircle, AlertCircle, Loader2,
  LogIn, LogOut, Plus, Trash2, GripVertical, Save,
  ChevronDown, ChevronRight
} from "lucide-react";

const OWNER = "hazem-alabiad";
const REPO = "hazem-alabiad.github.io";
const CV_PATH = "src/imports/Hazem-Alabiad-CV.pdf";
const CONTENT_PATH = "src/content.json";
const TOKEN_KEY = "cms_gh_token";
const BRANCH = "main";

/* ─── Types ─────────────────────────────────────────────── */
interface HeroContent {
  name: string; tagline: string; location: string; bio: string;
  researchFocus: string; email: string; phone: string;
  github: string; linkedin: string;
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

/* ─── Style helpers ─────────────────────────────────────── */
const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const input: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8,
  background: "#09090f", border: "1px solid rgba(94,234,212,0.15)",
  color: "#eeeef5", fontSize: 13, outline: "none", boxSizing: "border-box" as const,
};
const label: React.CSSProperties = {
  fontSize: 11, color: "#5eead4", letterSpacing: "0.1em",
  textTransform: "uppercase" as const, marginBottom: 4, display: "block",
  ...MONO,
};
const card: React.CSSProperties = {
  background: "#111119", border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 12, padding: 20, marginBottom: 12,
};
const btn = (primary = false): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", borderRadius: 8, cursor: "pointer",
  fontSize: 12, fontWeight: 600, border: "none",
  background: primary ? "#5eead4" : "rgba(255,255,255,0.06)",
  color: primary ? "#09090f" : "#d4d4e0",
  transition: "opacity 0.15s",
});
const dangerBtn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer",
  color: "#f87171", padding: 4, display: "flex", alignItems: "center",
};

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ─── Section wrapper ───────────────────────────────────── */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 32 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", background: "none", border: "none",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", padding: "10px 0", marginBottom: open ? 16 : 0,
          borderBottom: "1px solid rgba(94,234,212,0.1)",
        }}
      >
        <span style={{ ...MONO, fontSize: 11, color: "#5eead4", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          {title}
        </span>
        {open ? <ChevronDown size={14} style={{ color: "#6b6b82" }} /> : <ChevronRight size={14} style={{ color: "#6b6b82" }} />}
      </button>
      {open && children}
    </div>
  );
}

/* ─── Field ─────────────────────────────────────────────── */
function Field({ label: l, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <span style={label}>{l}</span>
      {children}
    </div>
  );
}

/* ─── Main CMS Page ─────────────────────────────────────── */
export default function CmsPage() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [isOwner, setIsOwner] = useState(false);
  const [authChecking, setAuthChecking] = useState(false);
  const [authError, setAuthError] = useState("");
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveMsgType, setSaveMsgType] = useState<"success" | "error">("success");

  // CV upload
  const [cvStatus, setCvStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [cvMsg, setCvMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // On mount: if token exists, auto-verify
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) { setToken(stored); verifyToken(stored); }
  }, []);

  async function verifyToken(t: string) {
    setAuthChecking(true); setAuthError("");
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error("Invalid token.");
      const user = await res.json();
      if (user.login !== OWNER) throw new Error(`Access denied: logged in as '${user.login}'.`);
      localStorage.setItem(TOKEN_KEY, t);
      setIsOwner(true);
      loadContent(t);
    } catch (e: unknown) {
      setAuthError(e instanceof Error ? e.message : "Auth failed.");
      setIsOwner(false);
    } finally { setAuthChecking(false); }
  }

  async function loadContent(t: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}?ref=${BRANCH}`,
        { headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json" } }
      );
      if (res.ok) {
        const data = await res.json();
        const decoded = JSON.parse(atob(data.content.replace(/\n/g, "")));
        setContent(decoded);
      } else {
        // content.json doesn't exist yet — start with empty structure
        setContent(getEmptyContent());
      }
    } catch { setContent(getEmptyContent()); }
    finally { setLoading(false); }
  }

  function getEmptyContent(): SiteContent {
    return {
      hero: { name: "", tagline: "", location: "", bio: "", researchFocus: "", email: "", phone: "", github: "", linkedin: "" },
      experience: [], projects: [], skills: [], education: [], languages: [],
    };
  }

  async function handleSave() {
    if (!content) return;
    setSaving(true); setSaveMsg("");
    try {
      const t = localStorage.getItem(TOKEN_KEY) || token;
      const jsonContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
      // Get current SHA if file exists
      let sha: string | undefined;
      const getRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}?ref=${BRANCH}`,
        { headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json" } }
      );
      if (getRes.ok) { const d = await getRes.json(); sha = d.sha; }

      const body: Record<string, string> = {
        message: `cms: update portfolio content [${new Date().toISOString()}]`,
        content: jsonContent,
        branch: BRANCH,
      };
      if (sha) body.sha = sha;

      const putRes = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}`,
        { method: "PUT", headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (!putRes.ok) { const err = await putRes.json(); throw new Error(err.message); }
      setSaveMsg("✅ Saved! Site will rebuild in ~1 min.");
      setSaveMsgType("success");
    } catch (e: unknown) {
      setSaveMsg(e instanceof Error ? e.message : "Save failed.");
      setSaveMsgType("error");
    } finally { setSaving(false); }
  }

  async function handleCvUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setCvMsg("Select a PDF first."); setCvStatus("error"); return; }
    if (!file.name.endsWith(".pdf")) { setCvMsg("Only PDF files allowed."); setCvStatus("error"); return; }
    setCvStatus("uploading"); setCvMsg("Uploading...");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const t = localStorage.getItem(TOKEN_KEY) || token;
      const headers = { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" };
      let sha: string | undefined;
      const getRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${CV_PATH}`, { headers });
      if (getRes.ok) { const d = await getRes.json(); sha = d.sha; }
      const body: Record<string, string> = { message: `cv: update CV PDF [${new Date().toISOString()}]`, content: base64, branch: BRANCH };
      if (sha) body.sha = sha;
      const putRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${CV_PATH}`, { method: "PUT", headers, body: JSON.stringify(body) });
      if (!putRes.ok) { const err = await putRes.json(); throw new Error(err.message); }
      setCvStatus("success"); setCvMsg("✅ CV uploaded! Rebuilding in ~1 min.");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: unknown) { setCvStatus("error"); setCvMsg(e instanceof Error ? e.message : "Upload failed."); }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(""); setIsOwner(false); setContent(null);
  }

  /* ── render helpers ──────────────────────────────────── */
  function setHero(field: keyof HeroContent, value: string) {
    setContent(c => c ? { ...c, hero: { ...c.hero, [field]: value } } : c);
  }

  function updateExp(id: string, field: keyof ExpItem, value: string | string[]) {
    setContent(c => c ? { ...c, experience: c.experience.map(e => e.id === id ? { ...e, [field]: value } : e) } : c);
  }
  function addExp() {
    setContent(c => c ? { ...c, experience: [...c.experience, { id: uid(), role: "", company: "", location: "", period: "", bullets: [""] }] } : c);
  }
  function removeExp(id: string) {
    setContent(c => c ? { ...c, experience: c.experience.filter(e => e.id !== id) } : c);
  }

  function updateProj(id: string, field: keyof ProjItem, value: string) {
    setContent(c => c ? { ...c, projects: c.projects.map(p => p.id === id ? { ...p, [field]: value } : p) } : c);
  }
  function addProj() {
    setContent(c => c ? { ...c, projects: [...c.projects, { id: uid(), title: "", year: "", description: "", link: "" }] } : c);
  }
  function removeProj(id: string) {
    setContent(c => c ? { ...c, projects: c.projects.filter(p => p.id !== id) } : c);
  }

  function updateSkill(id: string, field: keyof SkillGroup, value: string) {
    setContent(c => c ? { ...c, skills: c.skills.map(s => s.id === id ? { ...s, [field]: value } : s) } : c);
  }
  function addSkill() {
    setContent(c => c ? { ...c, skills: [...c.skills, { id: uid(), label: "", skills: "" }] } : c);
  }
  function removeSkill(id: string) {
    setContent(c => c ? { ...c, skills: c.skills.filter(s => s.id !== id) } : c);
  }

  function updateEdu(id: string, field: keyof EduItem, value: string) {
    setContent(c => c ? { ...c, education: c.education.map(e => e.id === id ? { ...e, [field]: value } : e) } : c);
  }
  function addEdu() {
    setContent(c => c ? { ...c, education: [...c.education, { id: uid(), degree: "", school: "", location: "", period: "", notes: "" }] } : c);
  }
  function removeEdu(id: string) {
    setContent(c => c ? { ...c, education: c.education.filter(e => e.id !== id) } : c);
  }

  function updateLang(id: string, field: keyof LangItem, value: string) {
    setContent(c => c ? { ...c, languages: c.languages.map(l => l.id === id ? { ...l, [field]: value } : l) } : c);
  }
  function addLang() {
    setContent(c => c ? { ...c, languages: [...c.languages, { id: uid(), name: "", level: "" }] } : c);
  }
  function removeLang(id: string) {
    setContent(c => c ? { ...c, languages: c.languages.filter(l => l.id !== id) } : c);
  }

  /* ─── Page layout ───────────────────────────────────── */
  const PAGE: React.CSSProperties = {
    minHeight: "100vh",
    background: "#09090f",
    color: "#d4d4e0",
    fontFamily: "'DM Sans', sans-serif",
  };

  /* ── LOGIN SCREEN ── */
  if (!isOwner) {
    return (
      <div style={{ ...PAGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 380, background: "#111119", border: "1px solid rgba(94,234,212,0.2)", borderRadius: 20, padding: 36 }}>
          <p style={{ ...MONO, fontSize: 11, color: "#5eead4", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Portfolio CMS</p>
          <h1 style={{ fontSize: 22, color: "#eeeef5", fontFamily: "'DM Serif Display', serif", marginBottom: 24 }}>Sign in</h1>
          <Field label="GitHub PAT">
            <input
              type="password" placeholder="ghp_xxxxxxxxxxxx"
              value={token} onChange={e => setToken(e.target.value)}
              onKeyDown={e => e.key === "Enter" && verifyToken(token)}
              style={input}
            />
          </Field>
          {authError && (
            <p style={{ fontSize: 12, color: "#f87171", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <AlertCircle size={13} /> {authError}
            </p>
          )}
          <button
            onClick={() => verifyToken(token)}
            disabled={authChecking}
            style={{ ...btn(true), width: "100%", justifyContent: "center", padding: "11px 0", fontSize: 13 }}
          >
            {authChecking ? <><Loader2 size={14} className="animate-spin" /> Verifying...</> : <><LogIn size={14} /> Sign in</>}
          </button>
          <p style={{ marginTop: 16, fontSize: 11, color: "#4a4a60", lineHeight: 1.7, textAlign: "center" }}>
            Token stays in <code style={{ color: "#5eead4" }}>localStorage</code> — never sent to third parties.
          </p>
        </div>
      </div>
    );
  }

  /* ── LOADING ── */
  if (loading || !content) {
    return (
      <div style={{ ...PAGE, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <Loader2 size={20} className="animate-spin" style={{ color: "#5eead4" }} />
        <span style={{ color: "#6b6b82", fontSize: 13 }}>Loading content...</span>
      </div>
    );
  }

  /* ── MAIN EDITOR ── */
  return (
    <div style={PAGE}>
      {/* Top bar */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(9,9,15,0.92)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(94,234,212,0.1)",
        padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ ...MONO, fontSize: 11, color: "#5eead4", letterSpacing: "0.2em", textTransform: "uppercase" }}>Portfolio CMS</span>
          <span style={{ fontSize: 11, color: "#4a4a60" }}>·</span>
          <span style={{ fontSize: 12, color: "#5eead4", opacity: 0.6 }}>{OWNER}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {saveMsg && (
            <span style={{ fontSize: 12, color: saveMsgType === "success" ? "#5eead4" : "#f87171" }}>{saveMsg}</span>
          )}
          <button onClick={handleSave} disabled={saving} style={btn(true)}>
            {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : <><Save size={13} /> Save & Deploy</>}
          </button>
          <a href="/" style={{ ...btn(), textDecoration: "none" }}>
            <X size={13} /> Exit CMS
          </a>
          <button onClick={logout} style={{ ...btn(), background: "none", color: "#6b6b82" }}>
            <LogOut size={13} />
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── HERO ── */}
        <Section title="Hero">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {([
              ["name", "Full Name"], ["tagline", "Tagline"], ["location", "Location"],
              ["email", "Email"], ["phone", "Phone"], ["github", "GitHub (no https://)"],
              ["linkedin", "LinkedIn (no https://)"],
            ] as [keyof HeroContent, string][]).map(([field, lbl]) => (
              <Field key={field} label={lbl}>
                <input
                  style={input} value={content.hero[field]}
                  onChange={e => setHero(field, e.target.value)}
                />
              </Field>
            ))}
          </div>
          <Field label="Bio">
            <textarea
              style={{ ...input, minHeight: 120, resize: "vertical" }}
              value={content.hero.bio}
              onChange={e => setHero("bio", e.target.value)}
            />
          </Field>
          <Field label="Research Focus">
            <input style={input} value={content.hero.researchFocus} onChange={e => setHero("researchFocus", e.target.value)} />
          </Field>
        </Section>

        {/* ── EXPERIENCE ── */}
        <Section title="Experience">
          {content.experience.map((exp, idx) => (
            <div key={exp.id} style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ ...MONO, fontSize: 11, color: "#6b6b82" }}>#{idx + 1}</span>
                <button onClick={() => removeExp(exp.id)} style={dangerBtn}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {([
                  ["role", "Role"], ["company", "Company"],
                  ["location", "Location"], ["period", "Period"],
                ] as [keyof ExpItem, string][]).map(([field, lbl]) => (
                  <Field key={field} label={lbl}>
                    <input style={input} value={exp[field] as string} onChange={e => updateExp(exp.id, field, e.target.value)} />
                  </Field>
                ))}
              </div>
              <Field label="Bullets (one per line)">
                <textarea
                  style={{ ...input, minHeight: 80, resize: "vertical" }}
                  value={exp.bullets.join("\n")}
                  onChange={e => updateExp(exp.id, "bullets", e.target.value.split("\n"))}
                />
              </Field>
            </div>
          ))}
          <button onClick={addExp} style={btn()}><Plus size={13} /> Add Role</button>
        </Section>

        {/* ── PROJECTS ── */}
        <Section title="Research & Projects">
          {content.projects.map((proj, idx) => (
            <div key={proj.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ ...MONO, fontSize: 11, color: "#6b6b82" }}>#{idx + 1}</span>
                <button onClick={() => removeProj(proj.id)} style={dangerBtn}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Title"><input style={input} value={proj.title} onChange={e => updateProj(proj.id, "title", e.target.value)} /></Field>
                <Field label="Year"><input style={input} value={proj.year} onChange={e => updateProj(proj.id, "year", e.target.value)} /></Field>
              </div>
              <Field label="Description">
                <textarea style={{ ...input, minHeight: 60, resize: "vertical" }} value={proj.description} onChange={e => updateProj(proj.id, "description", e.target.value)} />
              </Field>
              <Field label="Link"><input style={input} value={proj.link} onChange={e => updateProj(proj.id, "link", e.target.value)} /></Field>
            </div>
          ))}
          <button onClick={addProj} style={btn()}><Plus size={13} /> Add Project</button>
        </Section>

        {/* ── SKILLS ── */}
        <Section title="Skills">
          {content.skills.map((sg, idx) => (
            <div key={sg.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ ...MONO, fontSize: 11, color: "#6b6b82" }}>#{idx + 1}</span>
                <button onClick={() => removeSkill(sg.id)} style={dangerBtn}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <Field label="Group Label"><input style={input} value={sg.label} onChange={e => updateSkill(sg.id, "label", e.target.value)} /></Field>
                <Field label="Skills (comma-separated)"><input style={input} value={sg.skills} onChange={e => updateSkill(sg.id, "skills", e.target.value)} /></Field>
              </div>
            </div>
          ))}
          <button onClick={addSkill} style={btn()}><Plus size={13} /> Add Group</button>
        </Section>

        {/* ── EDUCATION ── */}
        <Section title="Education">
          {content.education.map((edu, idx) => (
            <div key={edu.id} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ ...MONO, fontSize: 11, color: "#6b6b82" }}>#{idx + 1}</span>
                <button onClick={() => removeEdu(edu.id)} style={dangerBtn}><Trash2 size={13} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Degree"><input style={input} value={edu.degree} onChange={e => updateEdu(edu.id, "degree", e.target.value)} /></Field>
                <Field label="School"><input style={input} value={edu.school} onChange={e => updateEdu(edu.id, "school", e.target.value)} /></Field>
                <Field label="Location"><input style={input} value={edu.location} onChange={e => updateEdu(edu.id, "location", e.target.value)} /></Field>
                <Field label="Period"><input style={input} value={edu.period} onChange={e => updateEdu(edu.id, "period", e.target.value)} /></Field>
              </div>
              <Field label="Notes"><input style={input} value={edu.notes} onChange={e => updateEdu(edu.id, "notes", e.target.value)} /></Field>
            </div>
          ))}
          <button onClick={addEdu} style={btn()}><Plus size={13} /> Add Degree</button>
        </Section>

        {/* ── LANGUAGES ── */}
        <Section title="Languages">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12 }}>
            {content.languages.map(lang => (
              <div key={lang.id} style={{ ...card, marginBottom: 0 }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
                  <button onClick={() => removeLang(lang.id)} style={dangerBtn}><Trash2 size={13} /></button>
                </div>
                <Field label="Language"><input style={input} value={lang.name} onChange={e => updateLang(lang.id, "name", e.target.value)} /></Field>
                <Field label="Level"><input style={input} value={lang.level} onChange={e => updateLang(lang.id, "level", e.target.value)} /></Field>
              </div>
            ))}
          </div>
          <button onClick={addLang} style={{ ...btn(), marginTop: 12 }}><Plus size={13} /> Add Language</button>
        </Section>

        {/* ── CV UPLOAD ── */}
        <Section title="CV / Resume">
          <div style={{ ...card, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={() => { setCvStatus("idle"); setCvMsg(""); }} />
            <button onClick={() => fileRef.current?.click()} style={btn()}>
              <Upload size={13} /> {fileRef.current?.files?.[0]?.name || "Choose PDF"}
            </button>
            <button
              onClick={handleCvUpload}
              disabled={cvStatus === "uploading"}
              style={btn(true)}
            >
              {cvStatus === "uploading" ? <><Loader2 size={13} className="animate-spin" /> Uploading...</> : <><Upload size={13} /> Upload CV</>}
            </button>
            {cvMsg && (
              <span style={{ fontSize: 12, color: cvStatus === "success" ? "#5eead4" : "#f87171" }}>{cvMsg}</span>
            )}
          </div>
        </Section>

      </div>
    </div>
  );
}
