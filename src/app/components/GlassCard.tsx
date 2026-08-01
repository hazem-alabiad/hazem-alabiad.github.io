import { useState } from "react";

const TEAL = "45,212,191";
const BORDER = "rgba(255,255,255,0.07)";
const SURFACE = "rgba(255,255,255,0.032)";

export function GlassCard({ children, className = "", style = {}, hover = true }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; hover?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`${className} glass-hover`}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: hovered ? "rgba(255,255,255,0.055)" : SURFACE,
        border: `1px solid ${hovered ? `rgba(${TEAL},0.28)` : BORDER}`,
        borderRadius: 16,
        backdropFilter: "blur(12px)",
        transition: "all 0.3s ease",
        boxShadow: hovered
          ? `0 0 32px rgba(${TEAL},0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3)`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
