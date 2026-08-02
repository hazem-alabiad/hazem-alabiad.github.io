const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const TEAL = "#2dd4bf";

export function SectionHeader({ label, id, icon, active }: { label: string; id: string; icon?: React.ReactNode; active?: boolean }) {
  return (
    <div id={id} className="flex items-center gap-5 mb-16 scroll-mt-24 section-header">
      {icon && (
        <div className="section-header-icon" style={{
          width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
          background: active ? `rgba(45,212,191,0.22)` : `rgba(45,212,191,0.1)`,
          border: `1px solid rgba(45,212,191,${active ? 0.6 : 0.25})`,
          color: TEAL, flexShrink: 0,
          boxShadow: active ? `0 0 22px rgba(45,212,191,0.35), 0 0 44px rgba(45,212,191,0.12)` : `0 0 12px rgba(45,212,191,0.08)`,
          transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
          transform: active ? "scale(1.06)" : "scale(1)",
        }}>{icon}</div>
      )}
      <span className="text-[11px] tracking-[0.3em] uppercase font-semibold section-header-label" style={{
        ...MONO, color: TEAL, opacity: active ? 1 : 0.55, transition: "opacity 0.5s ease",
        textShadow: active ? `0 0 14px rgba(45,212,191,0.6)` : "none",
      }}>{label}</span>
      <div className="flex-1 h-px section-header-line" style={{
        background: active
          ? `linear-gradient(90deg, rgba(45,212,191,0.7), transparent)`
          : "linear-gradient(90deg, rgba(45,212,191,0.3), transparent)",
        boxShadow: active ? `0 0 12px rgba(45,212,191,0.4)` : "none",
        transition: "all 0.5s ease",
      }} />
      <style>{`
        .section-header { cursor: default; }
        .section-header-icon { transition: all 0.35s cubic-bezier(0.16,1,0.3,1) !important; }
        .section-header:hover .section-header-icon { transform: scale(1.14) rotate(-10deg); box-shadow: 0 0 30px rgba(45,212,191,0.45); }
        .section-header:hover .section-header-label { opacity: 1 !important; text-shadow: 0 0 18px rgba(45,212,191,0.7); }
        .section-header-line { position: relative; overflow: hidden; }
        .section-header-line::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(45,212,191,0.5), transparent);
          transform: translateX(-100%);
        }
        .section-header:hover .section-header-line::after { animation: headerLineSweep 1s ease-in-out; }
        @keyframes headerLineSweep { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
      `}</style>
    </div>
  );
}
