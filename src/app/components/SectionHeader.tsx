const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const TEAL = "#2dd4bf";

export function SectionHeader({ label, id, icon }: { label: string; id: string; icon?: React.ReactNode }) {
  return (
    <div id={id} className="flex items-center gap-5 mb-16 scroll-mt-24">
      {icon && (
        <div style={{
          width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          background: `rgba(45,212,191,0.1)`, border: `1px solid rgba(45,212,191,0.25)`, color: TEAL, flexShrink: 0,
          boxShadow: `0 0 12px rgba(45,212,191,0.08)`,
        }}>{icon}</div>
      )}
      <span className="text-[11px] tracking-[0.3em] uppercase font-semibold" style={{ ...MONO, color: TEAL }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(45,212,191,0.3), transparent)" }} />
    </div>
  );
}
