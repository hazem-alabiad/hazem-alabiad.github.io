import { useState, useEffect } from "react";
import { LogOut, Plus, Trash2, Save, Upload, ChevronDown, ChevronUp, X } from "lucide-react";

const OWNER = "hazem-alabiad";
const REPO = "hazem-alabiad.github.io";
const CONTENT_PATH = "src/app/content.json";
const TOKEN_KEY = "cms_gh_token";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

function uid() { return Math.random().toString(36).slice(2, 9); }

interface HeroContent {
  name: string; tagline: string; location: string; bio: string;
  researchFocus: string; email: string; phone: string;
  github: string; linkedin: string; cvUrl: string;
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

/* ─── Field ──────────────────────────────────────────────── */
function Field({ label, value, onChange, textarea = false, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number;
}) {
  const base: React.CSSProperties = {
    width: "100%", background: "#0d0d14", border: "1px solid rgba(94,234,212,0.15)",
    borderRadius: 6, color: "#d4d4e0", padding: "8px 10px", fontSize: 13,
    fontFamily: "inherit", outline: "none", resize: textarea ? "vertical" : undefined,
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: "#5eead4", marginBottom: 4, ...MONO, textTransform: "uppercase", letterSpacing: "0.15em" }}>
        {label}
      </label>
      {textarea
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} style={base} />
        : <input value={value} onChange={e => onChange(e.target.value)} style={base} />}
    </div>
  );
}

/* ─── Section Wrapper ────────────────────────────────────── */
function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 16, border: "1px solid rgba(94,234,212,0.1)", borderRadius: 10, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", background: "#111119", border: "none", color: "#eeeef5",
          cursor: "pointer", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em",
        }}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={15} color="#5eead4" /> : <ChevronDown size={15} color="#5eead4" />}
      </button>
      {open && <div style={{ padding: "18px", background: "#0d0d16" }}>{children}</div>}
    </div>
  );
}

/* ─── BulletEditor ───────────────────────────────────────── */
function BulletEditor({ bullets, onChange }: { bullets: string[]; onChange: (b: string[]) => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <label style={{ display: "block", fontSize: 11, color: "#5eead4", marginBottom: 6, ...MONO, textTransform: "uppercase", letterSpacing: "0.15em" }}>Bullets</label>
      {bullets.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input
            value={b}
            onChange={e => { const nb = [...bullets]; nb[i] = e.target.value; onChange(nb); }}
            style={{ flex: 1, background: "#0d0d14", border: "1px solid rgba(94,234,212,0.12)", borderRadius: 5, color: "#d4d4e0", padding: "6px 8px", fontSize: 12, fontFamily: "inherit", outline: "none" }}
          />
          <button onClick={() => onChange(bullets.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: "0 4px" }}>
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...bullets, ""])}
        style={{ fontSize: 11, color: "#5eead4", background: "none", border: "1px dashed rgba(94,234,212,0.25)", borderRadius: 5, padding: "4px 10px", cursor: "pointer", ...MONO }}
      >
        + Add bullet
      </button>
    </div>
  );
}

/* ─── Login Screen ───────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setErr("");
    try {
      const r = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      });
      const u = await r.json();
      if (u.login !== OWNER) { setErr("Access denied: not the portfolio owner."); setLoading(false); return; }
      localStorage.setItem(TOKEN_KEY, token);
      onLogin(token);
    } catch {
      setErr("Network error. Check your token.");
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 360, background: "#111119", border: "1px solid rgba(94,234,212,0.15)", borderRadius: 12, padding: 32 }}>
        <h1 style={{ color: "#5eead4", fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Portfolio CMS</h1>
        <p style={{ color: "#6b6b82", fontSize: 13, marginBottom: 24 }}>Sign in with your GitHub PAT</p>
        <Field label="GitHub PAT (repo scope)" value={token} onChange={setToken} />
        {err && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{err}</p>}
        <button
          onClick={handleLogin} disabled={loading || !token}
          style={{ width: "100%", background: "#5eead4", color: "#09090f", border: "none", borderRadius: 7, padding: "10px 0", fontWeight: 700, fontSize: 14, cursor: loading ? "wait" : "pointer" }}
        >
          {loading ? "Verifying…" : "Sign in"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main CMS Page ──────────────────────────────────────── */
export default function CmsPage() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [content, setContent] = useState<SiteContent | null>(null);
  const [fileSha, setFileSha] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (!token) return;
    fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    }).then(r => r.json()).then(u => {
      if (u.login !== OWNER) { localStorage.removeItem(TOKEN_KEY); setToken(null); }
    }).catch(() => {});
  }, [token]);

  // Load content.json from GitHub
  useEffect(() => {
    if (!token) return;
    fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    })
      .then(r => r.json())
      .then(data => {
        setFileSha(data.sha);
        const decoded = JSON.parse(atob(data.content.replace(/\n/g, "")));
        setContent(decoded);
      })
      .catch(() => {});
  }, [token]);

  async function handleSave() {
    if (!token || !content) return;
    setSaving(true); setSaveMsg("");
    const body = JSON.stringify({
      message: "cms: update portfolio content",
      content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
      sha: fileSha,
      branch: "main",
    });
    const r = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${CONTENT_PATH}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
      body,
    });
    const data = await r.json();
    if (data.content?.sha) {
      setFileSha(data.content.sha);
      setSaveMsg("✅ Saved! Site rebuilding (~1 min)");
    } else {
      setSaveMsg("❌ Save failed. Try again.");
    }
    setSaving(false);
    setTimeout(() => setSaveMsg(""), 5000);
  }

  async function handleCvUpload() {
    if (!token || !cvFile) return;
    setCvUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      // Get SHA of existing CV
      let sha = "";
      try {
        const existing = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/src/imports/Hazem-Alabiad-CV.pdf`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
        }).then(r => r.json());
        sha = existing.sha || "";
      } catch {}
      const body: Record<string, string> = { message: "cms: update CV", content: base64, branch: "main" };
      if (sha) body.sha = sha;
      await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/src/imports/Hazem-Alabiad-CV.pdf`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setSaveMsg("✅ CV uploaded! Site rebuilding (~1 min)");
      setCvUploading(false);
      setTimeout(() => setSaveMsg(""), 5000);
    };
    reader.readAsDataURL(cvFile);
  }

  function signOut() { localStorage.removeItem(TOKEN_KEY); setToken(null); }

  if (!token) return <LoginScreen onLogin={setToken} />;
  if (!content) {
    return (
      <div style={{ minHeight: "100vh", background: "#09090f", display: "flex", alignItems: "center", justifyContent: "center", color: "#5eead4", ...MONO }}>
        Loading content…
      </div>
    );
  }

  function setHero(patch: Partial<HeroContent>) {
    setContent(c => c ? { ...c, hero: { ...c.hero, ...patch } } : c);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#09090f", color: "#d4d4e0" }}>

      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(9,9,15,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(94,234,212,0.1)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#5eead4", fontWeight: 700, fontSize: 15 }}>Portfolio CMS</span>
          <a href="/" style={{ fontSize: 11, color: "#6b6b82", textDecoration: "none", ...MONO }}>← back to site</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {saveMsg && <span style={{ fontSize: 12, color: saveMsg.startsWith("✅") ? "#5eead4" : "#ef4444", ...MONO }}>{saveMsg}</span>}
          <button
            onClick={handleSave} disabled={saving}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#5eead4", color: "#09090f", border: "none", borderRadius: 7, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save & Deploy"}
          </button>
          <button onClick={signOut} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "7px 12px", color: "#6b6b82", fontSize: 12, cursor: "pointer" }}>
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── Hero ─────────────────────────────────────────── */}
        <Section title="🧑 Hero" defaultOpen>
          <Field label="Name" value={content.hero.name} onChange={v => setHero({ name: v })} />
          <Field label="Tagline" value={content.hero.tagline} onChange={v => setHero({ tagline: v })} />
          <Field label="Location" value={content.hero.location} onChange={v => setHero({ location: v })} />
          <Field label="Bio" value={content.hero.bio} onChange={v => setHero({ bio: v })} textarea rows={6} />
          <Field label="Research Focus" value={content.hero.researchFocus} onChange={v => setHero({ researchFocus: v })} />
          <Field label="Email" value={content.hero.email} onChange={v => setHero({ email: v })} />
          <Field label="Phone" value={content.hero.phone} onChange={v => setHero({ phone: v })} />
          <Field label="GitHub (without https://)" value={content.hero.github} onChange={v => setHero({ github: v })} />
          <Field label="LinkedIn (without https://)" value={content.hero.linkedin} onChange={v => setHero({ linkedin: v })} />

          {/* CV upload */}
          <div style={{ marginTop: 16, padding: 14, background: "#111119", borderRadius: 8, border: "1px solid rgba(94,234,212,0.1)" }}>
            <label style={{ fontSize: 11, color: "#5eead4", display: "block", marginBottom: 8, ...MONO, textTransform: "uppercase", letterSpacing: "0.15em" }}>Upload CV (PDF)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="file" accept=".pdf" onChange={e => setCvFile(e.target.files?.[0] || null)}
                style={{ fontSize: 12, color: "#9494a8", flex: 1 }} />
              <button
                onClick={handleCvUpload} disabled={!cvFile || cvUploading}
                style={{ display: "flex", alignItems: "center", gap: 5, background: cvFile ? "#5eead4" : "#1a1a2e", color: cvFile ? "#09090f" : "#4a4a60", border: "none", borderRadius: 6, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: cvFile ? "pointer" : "default" }}
              >
                <Upload size={12} /> {cvUploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        </Section>

        {/* ── Experience ───────────────────────────────────── */}
        <Section title="💼 Experience">
          {content.experience.map((exp, i) => (
            <div key={exp.id} style={{ marginBottom: 20, padding: 14, background: "#111119", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#5eead4", ...MONO }}>#{i + 1} — {exp.role || "New Role"}</span>
                <button onClick={() => setContent(c => c ? { ...c, experience: c.experience.filter((_, j) => j !== i) } : c)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <Field label="Role" value={exp.role} onChange={v => setContent(c => { if (!c) return c; const e = [...c.experience]; e[i] = { ...e[i], role: v }; return { ...c, experience: e }; })} />
              <Field label="Company" value={exp.company} onChange={v => setContent(c => { if (!c) return c; const e = [...c.experience]; e[i] = { ...e[i], company: v }; return { ...c, experience: e }; })} />
              <Field label="Location" value={exp.location} onChange={v => setContent(c => { if (!c) return c; const e = [...c.experience]; e[i] = { ...e[i], location: v }; return { ...c, experience: e }; })} />
              <Field label="Period" value={exp.period} onChange={v => setContent(c => { if (!c) return c; const e = [...c.experience]; e[i] = { ...e[i], period: v }; return { ...c, experience: e }; })} />
              <BulletEditor bullets={exp.bullets} onChange={b => setContent(c => { if (!c) return c; const e = [...c.experience]; e[i] = { ...e[i], bullets: b }; return { ...c, experience: e }; })} />
            </div>
          ))}
          <button
            onClick={() => setContent(c => c ? { ...c, experience: [...c.experience, { id: uid(), role: "", company: "", location: "", period: "", bullets: [""] }] } : c)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5eead4", background: "none", border: "1px dashed rgba(94,234,212,0.3)", borderRadius: 7, padding: "8px 14px", cursor: "pointer", ...MONO }}
          >
            <Plus size={13} /> Add Experience
          </button>
        </Section>

        {/* ── Projects ─────────────────────────────────────── */}
        <Section title="🔬 Research & Projects">
          {content.projects.map((proj, i) => (
            <div key={proj.id} style={{ marginBottom: 16, padding: 14, background: "#111119", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#5eead4", ...MONO }}>#{i + 1} — {proj.title || "New Project"}</span>
                <button onClick={() => setContent(c => c ? { ...c, projects: c.projects.filter((_, j) => j !== i) } : c)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <Field label="Title" value={proj.title} onChange={v => setContent(c => { if (!c) return c; const p = [...c.projects]; p[i] = { ...p[i], title: v }; return { ...c, projects: p }; })} />
              <Field label="Year" value={proj.year} onChange={v => setContent(c => { if (!c) return c; const p = [...c.projects]; p[i] = { ...p[i], year: v }; return { ...c, projects: p }; })} />
              <Field label="Description" value={proj.description} onChange={v => setContent(c => { if (!c) return c; const p = [...c.projects]; p[i] = { ...p[i], description: v }; return { ...c, projects: p }; })} textarea />
              <Field label="Link" value={proj.link} onChange={v => setContent(c => { if (!c) return c; const p = [...c.projects]; p[i] = { ...p[i], link: v }; return { ...c, projects: p }; })} />
            </div>
          ))}
          <button
            onClick={() => setContent(c => c ? { ...c, projects: [...c.projects, { id: uid(), title: "", year: new Date().getFullYear().toString(), description: "", link: "" }] } : c)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5eead4", background: "none", border: "1px dashed rgba(94,234,212,0.3)", borderRadius: 7, padding: "8px 14px", cursor: "pointer", ...MONO }}
          >
            <Plus size={13} /> Add Project
          </button>
        </Section>

        {/* ── Skills ───────────────────────────────────────── */}
        <Section title="🛠 Skills">
          {content.skills.map((sg, i) => (
            <div key={sg.id} style={{ marginBottom: 14, padding: 14, background: "#111119", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#5eead4", ...MONO }}>{sg.label || "Group"}</span>
                <button onClick={() => setContent(c => c ? { ...c, skills: c.skills.filter((_, j) => j !== i) } : c)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <Field label="Group Label" value={sg.label} onChange={v => setContent(c => { if (!c) return c; const s = [...c.skills]; s[i] = { ...s[i], label: v }; return { ...c, skills: s }; })} />
              <Field label="Skills (comma-separated)" value={sg.skills} onChange={v => setContent(c => { if (!c) return c; const s = [...c.skills]; s[i] = { ...s[i], skills: v }; return { ...c, skills: s }; })} textarea rows={2} />
            </div>
          ))}
          <button
            onClick={() => setContent(c => c ? { ...c, skills: [...c.skills, { id: uid(), label: "", skills: "" }] } : c)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5eead4", background: "none", border: "1px dashed rgba(94,234,212,0.3)", borderRadius: 7, padding: "8px 14px", cursor: "pointer", ...MONO }}
          >
            <Plus size={13} /> Add Skill Group
          </button>
        </Section>

        {/* ── Education ────────────────────────────────────── */}
        <Section title="🎓 Education">
          {content.education.map((edu, i) => (
            <div key={edu.id} style={{ marginBottom: 14, padding: 14, background: "#111119", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: "#5eead4", ...MONO }}>{edu.degree || "Degree"}</span>
                <button onClick={() => setContent(c => c ? { ...c, education: c.education.filter((_, j) => j !== i) } : c)}
                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <Field label="Degree" value={edu.degree} onChange={v => setContent(c => { if (!c) return c; const e = [...c.education]; e[i] = { ...e[i], degree: v }; return { ...c, education: e }; })} />
              <Field label="School" value={edu.school} onChange={v => setContent(c => { if (!c) return c; const e = [...c.education]; e[i] = { ...e[i], school: v }; return { ...c, education: e }; })} />
              <Field label="Location" value={edu.location} onChange={v => setContent(c => { if (!c) return c; const e = [...c.education]; e[i] = { ...e[i], location: v }; return { ...c, education: e }; })} />
              <Field label="Period" value={edu.period} onChange={v => setContent(c => { if (!c) return c; const e = [...c.education]; e[i] = { ...e[i], period: v }; return { ...c, education: e }; })} />
              <Field label="Notes" value={edu.notes} onChange={v => setContent(c => { if (!c) return c; const e = [...c.education]; e[i] = { ...e[i], notes: v }; return { ...c, education: e }; })} textarea rows={2} />
            </div>
          ))}
          <button
            onClick={() => setContent(c => c ? { ...c, education: [...c.education, { id: uid(), degree: "", school: "", location: "", period: "", notes: "" }] } : c)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5eead4", background: "none", border: "1px dashed rgba(94,234,212,0.3)", borderRadius: 7, padding: "8px 14px", cursor: "pointer", ...MONO }}
          >
            <Plus size={13} /> Add Education
          </button>
        </Section>

        {/* ── Languages ────────────────────────────────────── */}
        <Section title="🌐 Languages">
          {content.languages.map((lang, i) => (
            <div key={lang.id} style={{ marginBottom: 10, display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1 }}><Field label="Language" value={lang.name} onChange={v => setContent(c => { if (!c) return c; const l = [...c.languages]; l[i] = { ...l[i], name: v }; return { ...c, languages: l }; })} /></div>
              <div style={{ flex: 1 }}><Field label="Level" value={lang.level} onChange={v => setContent(c => { if (!c) return c; const l = [...c.languages]; l[i] = { ...l[i], level: v }; return { ...c, languages: l }; })} /></div>
              <button onClick={() => setContent(c => c ? { ...c, languages: c.languages.filter((_, j) => j !== i) } : c)}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", marginTop: 8 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setContent(c => c ? { ...c, languages: [...c.languages, { id: uid(), name: "", level: "" }] } : c)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#5eead4", background: "none", border: "1px dashed rgba(94,234,212,0.3)", borderRadius: 7, padding: "8px 14px", cursor: "pointer", ...MONO }}
          >
            <Plus size={13} /> Add Language
          </button>
        </Section>

      </div>
    </div>
  );
}
