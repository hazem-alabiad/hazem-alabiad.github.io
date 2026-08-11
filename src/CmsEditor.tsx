import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { X, Plus, Trash2, FileUp, Lock, Save, RotateCcw } from "lucide-react";
import {
  uid,
  type CmsContent,
  type CmsExperience,
  type CmsProject,
  type CmsSkill,
  type CmsEducation,
  type CmsLanguage,
  type CmsContactLink,
} from "./cms";

const MONO: CSSProperties = { fontFamily: "var(--font-mono)" };
const DISPLAY: CSSProperties = { fontFamily: "var(--font-display)" };

const FIELD: CSSProperties = {
  ...MONO,
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
  background: "var(--bg-elevated)",
  border: "1px solid var(--rule-soft)",
  color: "var(--ink)",
  padding: "8px 12px",
  outline: "none",
  borderRadius: 6,
};

const inputStyle = (w = "auto"): CSSProperties => ({
  ...FIELD,
  width: w,
  display: "block",
});

function Label({ children }: { children: ReactNode }) {
  return (
    <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink-faint)", marginBottom: 6 }}>
      {children}
    </div>
  );
}

function Section({ title, accent = "var(--sage)", children }: { title: string; accent?: string; children: ReactNode }) {
  return (
    <div style={{ background: "var(--bg-panel)", border: "1px solid var(--rule-soft)", padding: 20, marginBottom: 20 }}>
      <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.22em", color: accent, marginBottom: 16 }}>
        ▸ {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{children}</div>
    </div>
  );
}

function AddButton({ onClick, children = "ADD" }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button onClick={onClick} style={{
      ...MONO, fontSize: 10, letterSpacing: "0.2em", color: "var(--amber)",
      background: "var(--amber-soft)", border: "1px dashed var(--amber)",
      padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, borderRadius: 6,
    }}>
      <Plus size={11} /> {children}
    </button>
  );
}


/* ── Editor shell ────────────────────────────────────────────────────────── */

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
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg)", overflowY: "auto", padding: "7vh 6vw", cursor: "auto" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.28em", color: "var(--sage)" }}>// FULL CV EDITOR</div>
            <h1 style={{ ...DISPLAY, fontWeight: 500, fontSize: "clamp(1.7rem,4vw,2.5rem)", color: "var(--ink)", margin: "6px 0 0" }}>
              Edit <em style={{ color: "var(--amber)", fontStyle: "italic" }}>Portfolio</em>
            </h1>
            <div style={{ ...MONO, fontSize: 9, color: "var(--ink-faint)", marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
              <Lock size={11} color="var(--sage)" /> VERIFIED — READ/WRITE ACCESS
            </div>
          </div>
          <button onClick={onClose} title="Close editor" style={{ background: "none", border: "1px solid var(--rule)", color: "var(--amber)", cursor: "pointer", padding: 10, borderRadius: 6 }}>
            <X size={16} />
          </button>
        </div>

        <>

          {/* Profile + Media */}
            <Section title="PROFILE & MEDIA">
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
                <div>
                  <Label>PICTURE</Label>
                  <input type="file" accept="image/*"
                    onChange={(e) => readFile(e.target.files?.[0], (d) => set("photo", d))}
                    style={{ display: "none" }} id="cms-photo" />
                  <label htmlFor="cms-photo" style={{ cursor: "pointer", display: "block", position: "relative" }}>
                    <img src={draft.photo ?? "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%23131015'/%3E%3C/svg%3E"}
                      style={{ width: 200, height: 200, objectFit: "cover", borderRadius: 12, border: "2px dashed var(--amber-soft)" }} alt="Portrait" />
                    <span style={{ position: "absolute", bottom: 8, left: 8, ...MONO, fontSize: 9, letterSpacing: "0.15em", color: "var(--amber-ink)", background: "var(--amber)", padding: "4px 8px", borderRadius: 4 }}>
                      {draft.photo ? "REPLACE IMG" : "UPLOAD IMG"}
                    </span>
                  </label>
                  {draft.photo && (
                    <button onClick={() => set("photo", null)} style={{ ...MONO, fontSize: 9, color: "var(--red)", background: "none", border: "none", cursor: "pointer", marginTop: 8 }}>
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
                      ...MONO, fontSize: 10, letterSpacing: "0.18em", color: "var(--amber)",
                      border: "1px dashed var(--amber)", background: "var(--amber-soft)",
                      padding: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, justifyContent: "center", borderRadius: 6,
                    }}>
                      <FileUp size={15} /> {draft.cvDataUrl ? "REPLACE CV PDF" : "UPLOAD CV PDF"}
                    </label>
                    {draft.cvDataUrl && (
                      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                        <a href={draft.cvDataUrl} download="Hazem-Alabiad-CV.pdf" style={{ ...MONO, fontSize: 9, color: "var(--sage)" }}>PREVIEW PDF</a>
                        <button onClick={() => set("cvDataUrl", null)} style={{ ...MONO, fontSize: 9, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>REMOVE</button>
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

            {/* About facts */}
            <Section title="ABOUT — QUICK FACTS">
              <div>
                <Label>LOCATION FACT (shown in terminal)</Label><input value={draft.factLocation} onChange={(e) => set("factLocation", e.target.value)} style={inputStyle("100%")} />
              </div>
              <div>
                <Label>CONTACT INTRO</Label>
                <textarea value={draft.contactIntro} onChange={(e) => set("contactIntro", e.target.value)} rows={3} style={inputStyle("100%")} />
              </div>
            </Section>

            {/* Experience */}
            <Section title="EXPERIENCE">
              {draft.experience.map((exp, i) => (
                <div key={exp.id} style={{ border: "1px solid var(--rule)", padding: 14, position: "relative", borderRadius: 8 }}>
                  <button onClick={() => set("experience", draft.experience.filter((_, j) => j !== i))}
                    style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div><Label>ROLE</Label><input value={exp.role} onChange={(e) => updExp(i, { role: e.target.value })} style={inputStyle("100%")} /></div>
                    <div><Label>COMPANY</Label><input value={exp.company} onChange={(e) => updExp(i, { company: e.target.value })} style={inputStyle("100%")} /></div>
                    <div><Label>LOCATION</Label><input value={exp.location} onChange={(e) => updExp(i, { location: e.target.value })} style={inputStyle("100%")} /></div>
                    <div><Label>PERIOD</Label><input value={exp.period} onChange={(e) => updExp(i, { period: e.target.value })} style={inputStyle("100%")} /></div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <label style={{ ...MONO, fontSize: 10, color: "var(--sage)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
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

            {/* Education */}
            <Section title="EDUCATION">
              {draft.education.map((edu, i) => (
                <div key={edu.id} style={{ border: "1px solid var(--rule)", padding: 14, position: "relative", borderRadius: 8 }}>
                  <button onClick={() => set("education", draft.education.filter((_, j) => j !== i))}
                    style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div><Label>DEGREE</Label><input value={edu.degree} onChange={(e) => updEdu(i, { degree: e.target.value })} style={inputStyle("100%")} /></div>
                    <div><Label>SCHOOL</Label><input value={edu.school} onChange={(e) => updEdu(i, { school: e.target.value })} style={inputStyle("100%")} /></div>
                    <div><Label>LOCATION</Label><input value={edu.location} onChange={(e) => updEdu(i, { location: e.target.value })} style={inputStyle("100%")} /></div>
                    <div><Label>PERIOD</Label><input value={edu.period} onChange={(e) => updEdu(i, { period: e.target.value })} style={inputStyle("100%")} /></div>
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <label style={{ ...MONO, fontSize: 10, color: "var(--sage)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <input type="checkbox" checked={edu.current} onChange={(e) => updEdu(i, { current: e.target.checked })} /> CURRENT
                      </label>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <Label>DETAIL</Label>
                    <textarea value={edu.detail} onChange={(e) => updEdu(i, { detail: e.target.value })} rows={2} style={inputStyle("100%")} />
                  </div>
                </div>
              ))}
              <AddButton onClick={() => set("education", [...draft.education, { id: uid(), degree: "", school: "", location: "", period: "", detail: "", current: false }])} />
            </Section>

            {/* Projects */}
            <Section title="PROJECTS">
              {draft.projects.map((p, i) => (
                <div key={p.id} style={{ border: "1px solid var(--rule)", padding: 14, position: "relative", borderRadius: 8 }}>
                  <button onClick={() => set("projects", draft.projects.filter((_, j) => j !== i))}
                    style={{ position: "absolute", top: 10, right: 10, background: "none", border: "none", color: "var(--red)", cursor: "pointer" }}>
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
                    <Label>IMPACT</Label>
                    <input value={p.impact} onChange={(e) => updProj(i, { impact: e.target.value })} style={inputStyle("100%")} />
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
                  <button onClick={() => set("skills", draft.skills.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", marginBottom: 6 }}>
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
                  <button onClick={() => set("languages", draft.languages.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", marginBottom: 6 }}>
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
                  <button onClick={() => set("links", draft.links.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", marginBottom: 6 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <AddButton onClick={() => set("links", [...draft.links, { id: uid(), label: "LINK", value: "", href: "https://" }])} />
            </Section>
          </>

        {/* Footer actions */}
        <div style={{ position: "sticky", bottom: 16, display: "flex", gap: 12, background: "var(--bg)", padding: "14px 0" }}>
          <button onClick={save} style={{ ...MONO, fontSize: 11, letterSpacing: "0.25em", padding: "13px 26px", cursor: "pointer", background: saved ? "var(--sage-soft)" : "var(--amber-soft)", border: `1px solid ${saved ? "var(--sage)" : "var(--amber)"}`, color: saved ? "var(--sage)" : "var(--amber)", flex: 1, borderRadius: 6 }}>
            {saved ? "✓ SAVED" : "SAVE CHANGES"}
          </button>
          <button onClick={() => { if (confirm("Reset ALL CMS edits back to defaults?")) { onReset(); onClose(); } }}
            style={{ ...MONO, fontSize: 11, letterSpacing: "0.25em", padding: "13px 20px", cursor: "pointer", background: "var(--violet-soft)", border: "1px solid var(--violet)", color: "var(--violet)", display: "flex", alignItems: "center", gap: 8, borderRadius: 6 }}>
            <RotateCcw size={13} /> RESET
          </button>
        </div>
      </div>
    </div>
  );

  function updExp(i: number, patch: Partial<CmsExperience>) {
    set("experience", draft.experience.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  }
  function updEdu(i: number, patch: Partial<CmsEducation>) {
    set("education", draft.education.map((e, j) => (j === i ? { ...e, ...patch } : e)));
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
