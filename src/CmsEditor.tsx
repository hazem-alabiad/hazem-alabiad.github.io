import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { X, Plus, Trash2, FileUp, Lock, Save, RotateCcw } from "lucide-react";
import {
  uid,
  type CmsContent,
  type CmsExperience,
  type CmsProject,
  type CmsSkill,
  type CmsLanguage,
  type CmsContactLink,
} from "./cms";

const MONO: CSSProperties = { fontFamily: '"JetBrains Mono", monospace' };
const FIELD: CSSProperties = {
  ...MONO,
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
  background: "#080f1c",
  border: "1px solid rgba(0,240,255,0.15)",
  color: "#e2e8f4",
  padding: "8px 12px",
  outline: "none",
  borderRadius: 4,
};

const inputStyle = (w = "auto"): CSSProperties => ({
  ...FIELD,
  width: w,
  display: "block",
});

function Label({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6b8fab", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: "#0b1020", border: "1px solid rgba(0,240,255,0.1)", padding: 20, marginBottom: 20 }}>
      <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.25em", color: "#00f0ff", marginBottom: 16 }}>
        ▸ {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      ...MONO, fontSize: 10, letterSpacing: "0.2em", color: "#00f0ff",
      background: "rgba(0,240,255,0.05)", border: "1px dashed rgba(0,240,255,0.35)",
      padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
    }}>
      <Plus size={11} /> ADD
    </button>
  );
}

export default function CmsEditor({
  initial,
  onSave,
  onReset,
  onClose,
}: {
  initial: CmsContent;
  onSave: (c: CmsContent) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<CmsContent>(() => structuredClone(initial));
  const [saved, setSaved] = useState(false);

  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);

  const set = <K extends keyof CmsContent>(key: K, val: CmsContent[K]) => setDraft((d) => ({ ...d, [key]: val }));

  const save = () => { onSave(structuredClone(draft)); setSaved(true); setTimeout(() => setSaved(false), 1600); };

  const readFile = (file: File | undefined, cb: (dataUrl: string) => void) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => cb(r.result as string);
    r.readAsDataURL(file);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#050814", overflowY: "auto", padding: "7vh 6vw", cursor: "auto" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.3em", color: "#9d4edd" }}>// FULL CV EDITOR</div>
            <h1 style={{ fontFamily: '"Audiowide", cursive', fontSize: "clamp(1.6rem,4vw,2.4rem)", color: "#e2e8f4", margin: "8px 0 0" }}>
              Edit <span style={{ color: "#00f0ff" }}>Portfolio</span>
            </h1>
            <div style={{ ...MONO, fontSize: 9, color: "#4d6b8a", marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={11} color="#28c840" /> VERIFIED — READ/WRITE ACCESS
            </div>
          </div>
          <button onClick={onClose} title="Close editor" style={{ background: "none", border: "1px solid rgba(0,240,255,0.3)", color: "#00f0ff", cursor: "pointer", padding: 10 }}>
            <X size={16} />
          </button>
        </div>

        {/* Profile + Media */}
        <Section title="PROFILE & MEDIA">
          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20 }}>
            <div>
              <Label>PICTURE</Label>
              <input type="file" accept="image/*"
                onChange={(e) => readFile(e.target.files?.[0], (d) => set("photo", d))}
                style={{ display: "none" }} id="cms-photo" />
              <label htmlFor="cms-photo" style={{ cursor: "pointer", display: "block", position: "relative" }}>
                <img src={draft.photo ?? "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Crect width='220' height='220' fill='%23080f1c'/%3E%3C/svg%3E"}
                  style={{ width: 220, height: 220, objectFit: "cover", borderRadius: 12, border: "2px dashed rgba(0,240,255,0.3)" }} alt="Portrait" />
                <span style={{ position: "absolute", bottom: 8, left: 8, ...MONO, fontSize: 9, letterSpacing: "0.15em", color: "#050814", background: "#00f0ff", padding: "4px 8px" }}>
                  {draft.photo ? "REPLACE IMG" : "UPLOAD IMG"}
                </span>
              </label>
              {draft.photo && (
                <button onClick={() => set("photo", null)} style={{ ...MONO, fontSize: 9, color: "#ff4757", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
                  REMOVE PICTURE
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <Label>CV PDF</Label>
                <input type="file" accept="application/pdf,.pdf"
                  onChange={(e) => readFile(e.target.files?.[0], (d) => set("cvDataUrl", d))}
                  style={{ display: "none" }} id="cms-cv" />
                <label htmlFor="cms-cv" style={{
                  ...MONO, fontSize: 10, letterSpacing: "0.2em", color: "#00f0ff",
                  border: "1px dashed rgba(0,240,255,0.35)", background: "rgba(0,240,255,0.05)",
                  padding: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, justifyContent: "center",
                }}>
                  <FileUp size={15} /> {draft.cvDataUrl ? "REPLACE CV PDF" : "UPLOAD CV PDF"}
                </label>
                {draft.cvDataUrl && (
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <a href={draft.cvDataUrl} download="Hazem-Alabiad-CV.pdf" style={{ ...MONO, fontSize: 9, color: "#00f0ff" }}>PREVIEW PDF</a>
                    <button onClick={() => set("cvDataUrl", null)} style={{ ...MONO, fontSize: 9, color: "#ff4757", background: "none", border: "none", cursor: "pointer" }}>REMOVE</button>
                  </div>
                )}
              </div>
              <div>
                <Label>HERO TAGLINE</Label>
                <textarea value={draft.heroTagline} onChange={(e) => set("heroTagline", e.target.value)} rows={3} style={inputStyle("100%")} />
              </div>
              <div>
                <Label>FOOTER LINE</Label>
                <input value={draft.footerLine} onChange={(e) => set("footerLine", e.target.value)} style={inputStyle("100%")} />
              </div>
            </div>
          </div>
        </Section>

        {/* About */}
        <Section title="ABOUT">
          <div>
            <Label>BIO 1</Label>
            <textarea value={draft.bio1} onChange={(e) => set("bio1", e.target.value)} rows={4} style={inputStyle("100%")} />
          </div>
          <div>
            <Label>BIO 2</Label>
            <textarea value={draft.bio2} onChange={(e) => set("bio2", e.target.value)} rows={4} style={inputStyle("100%")} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><Label>LOCATION FACT</Label><input value={draft.factLocation} onChange={(e) => set("factLocation", e.target.value)} style={inputStyle("100%")} /></div>
            <div><Label>DEGREE FACT</Label><input value={draft.factDegree} onChange={(e) => set("factDegree", e.target.value)} style={inputStyle("100%")} /></div>
            <div><Label>CURRENT ROLE FACT</Label><input value={draft.factCurrent} onChange={(e) => set("factCurrent", e.target.value)} style={inputStyle("100%")} /></div>
            <div><Label>AVAILABLE FOR</Label><input value={draft.factAvailable} onChange={(e) => set("factAvailable", e.target.value)} style={inputStyle("100%")} /></div>
          </div>
        </Section>

        {/* Experience */}
        <Section title="EXPERIENCE">
          {draft.experience.map((exp, i) => (
            <div key={exp.id} style={{ border: "1px solid rgba(157,78,221,0.15)", padding: 14, position: "relative" }}>
              <button onClick={() => set("experience", draft.experience.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "#ff4757", cursor: "pointer" }}>
                <Trash2 size={14} />
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div><Label>ROLE</Label><input value={exp.role} onChange={(e) => updExp(i, { role: e.target.value })} style={inputStyle("100%")} /></div>
                <div><Label>COMPANY</Label><input value={exp.company} onChange={(e) => updExp(i, { company: e.target.value })} style={inputStyle("100%")} /></div>
                <div><Label>LOCATION</Label><input value={exp.location} onChange={(e) => updExp(i, { location: e.target.value })} style={inputStyle("100%")} /></div>
                <div><Label>PERIOD</Label><input value={exp.period} onChange={(e) => updExp(i, { period: e.target.value })} style={inputStyle("100%")} /></div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <label style={{ ...MONO, fontSize: 10, color: "#00f0ff", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <input type="checkbox" checked={exp.current} onChange={(e) => updExp(i, { current: e.target.checked })} /> CURRENT
                  </label>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <Label>BULLETS (one per line)</Label>
                <textarea value={exp.bullets.join("\n")} onChange={(e) => updExp(i, { bullets: e.target.value.split("\n") })} rows={3} style={inputStyle("100%")} />
              </div>
              <div style={{ marginTop: 10 }}>
                <Label>TAGS (comma-separated)</Label>
                <input value={exp.tags.join(", ")} onChange={(e) => updExp(i, { tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} style={inputStyle("100%")} />
              </div>
            </div>
          ))}
          <AddButton onClick={() => set("experience", [...draft.experience, { id: uid(), role: "", company: "", location: "", period: "", bullets: [""], tags: [], current: false }])} />
        </Section>

        {/* Projects */}
        <Section title="PROJECTS">
          {draft.projects.map((p, i) => (
            <div key={p.id} style={{ border: "1px solid rgba(0,240,255,0.15)", padding: 14, position: "relative" }}>
              <button onClick={() => set("projects", draft.projects.filter((_, j) => j !== i))}
                style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "#ff4757", cursor: "pointer" }}>
                <Trash2 size={14} />
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 1fr", gap: 10 }}>
                <div><Label>NAME</Label><input value={p.name} onChange={(e) => updProj(i, { name: e.target.value })} style={inputStyle("100%")} /></div>
                <div><Label>STATUS</Label><input value={p.status} onChange={(e) => updProj(i, { status: e.target.value })} style={inputStyle("100%")} /></div>
                <div><Label>YEAR</Label><input value={p.year} onChange={(e) => updProj(i, { year: e.target.value })} style={inputStyle("100%")} /></div>
                <div><Label>LINK</Label><input value={p.link} onChange={(e) => updProj(i, { link: e.target.value })} style={inputStyle("100%")} /></div>
              </div>
              <div style={{ marginTop: 10 }}>
                <Label>DESCRIPTION</Label>
                <textarea value={p.desc} onChange={(e) => updProj(i, { desc: e.target.value })} rows={3} style={inputStyle("100%")} />
              </div>
              <div style={{ marginTop: 10 }}>
                <Label>TAGS (comma-separated)</Label>
                <input value={p.tags.join(", ")} onChange={(e) => updProj(i, { tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} style={inputStyle("100%")} />
              </div>
            </div>
          ))}
          <AddButton onClick={() => set("projects", [...draft.projects, { id: uid(), name: "", desc: "", tags: [], status: "ACTIVE", year: "2026", link: "https://github.com/hazem-alabiad" }])} />
        </Section>

        {/* Skills */}
        <Section title="SKILLS">
          {draft.skills.map((s, i) => (
            <div key={s.id} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}><Label>SKILL</Label><input value={s.label} onChange={(e) => updSkill(i, { label: e.target.value })} style={inputStyle("100%")} /></div>
              <div style={{ width: 90 }}><Label>LEVEL %</Label><input type="number" min={0} max={100} value={s.level} onChange={(e) => updSkill(i, { level: Number(e.target.value) || 0 })} style={inputStyle("100%")} /></div>
              <div style={{ width: 140 }}><Label>CATEGORY</Label>
                <select value={s.cat} onChange={(e) => updSkill(i, { cat: e.target.value as CmsSkill["cat"] })} style={inputStyle("100%")}>
                  <option value="stack">FULL-STACK</option>
                  <option value="ai">AI / NLP</option>
                </select>
              </div>
              <button onClick={() => set("skills", draft.skills.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ff4757", cursor: "pointer", marginBottom: 6 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <AddButton onClick={() => set("skills", [...draft.skills, { id: uid(), label: "", level: 85, cat: "stack" }])} />
        </Section>

        {/* Languages */}
        <Section title="LANGUAGES">
          {draft.languages.map((l, i) => (
            <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}><Label>LANGUAGE</Label><input value={l.name} onChange={(e) => updLang(i, { name: e.target.value })} style={inputStyle("100%")} /></div>
              <div style={{ width: 200 }}><Label>LEVEL</Label><input value={l.level} onChange={(e) => updLang(i, { level: e.target.value })} style={inputStyle("100%")} /></div>
              <button onClick={() => set("languages", draft.languages.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ff4757", cursor: "pointer", marginBottom: 6 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <AddButton onClick={() => set("languages", [...draft.languages, { id: uid(), name: "", level: "Proficient" }])} />
        </Section>

        {/* Contact links */}
        <Section title="CONTACT LINKS">
          {draft.links.map((l, i) => (
            <div key={l.id} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ width: 120 }}><Label>LABEL</Label><input value={l.label} onChange={(e) => updLink(i, { label: e.target.value })} style={inputStyle("100%")} /></div>
              <div style={{ flex: 1 }}><Label>VALUE</Label><input value={l.value} onChange={(e) => updLink(i, { value: e.target.value })} style={inputStyle("100%")} /></div>
              <div style={{ flex: 1 }}><Label>HREF</Label><input value={l.href} onChange={(e) => updLink(i, { href: e.target.value })} style={inputStyle("100%")} /></div>
              <button onClick={() => set("links", draft.links.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ff4757", cursor: "pointer", marginBottom: 6 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <AddButton onClick={() => set("links", [...draft.links, { id: uid(), label: "LINK", value: "", href: "https://" }])} />
          <div>
            <Label>CONTACT INTRO</Label>
            <textarea value={draft.contactIntro} onChange={(e) => set("contactIntro", e.target.value)} rows={3} style={inputStyle("100%")} />
          </div>
        </Section>

        {/* Footer actions */}
        <div style={{ position: "sticky", bottom: 16, display: "flex", gap: 12, background: "#050814", padding: "14px 0" }}>
          <button onClick={save} style={{ ...MONO, fontSize: 11, letterSpacing: "0.25em", padding: "13px 26px", cursor: "pointer", background: saved ? "rgba(40,200,64,0.15)" : "rgba(0,240,255,0.08)", border: `1px solid ${saved ? "#28c840" : "#00f0ff"}`, color: saved ? "#28c840" : "#00f0ff", flex: 1 }}>
            {saved ? "✓ SAVED" : "SAVE CHANGES"}
          </button>
          <button onClick={() => { if (confirm("Reset ALL CMS edits back to defaults?")) { onReset(); onClose(); } }}
            style={{ ...MONO, fontSize: 11, letterSpacing: "0.25em", padding: "13px 20px", cursor: "pointer", background: "rgba(157,78,221,0.06)", border: "1px solid rgba(157,78,221,0.4)", color: "#9d4edd", display: "flex", alignItems: "center", gap: 8 }}>
            <RotateCcw size={13} /> RESET
          </button>
        </div>
      </div>
    </div>
  );

  function updExp(i: number, patch: Partial<CmsExperience>) {
    set("experience", draft.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
  function updProj(i: number, patch: Partial<CmsProject>) {
    set("projects", draft.projects.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
  function updSkill(i: number, patch: Partial<CmsSkill>) {
    set("skills", draft.skills.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
  function updLang(i: number, patch: Partial<CmsLanguage>) {
    set("languages", draft.languages.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
  function updLink(i: number, patch: Partial<CmsContactLink>) {
    set("links", draft.links.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
}