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
        background: hovered ? "rgba(20,20,38,0.7)" : SURFACE,
        border: `1px solid ${hovered ? `rgba(${TEAL},0.3)` : BORDER}`,
        borderRadius: 16,
        backdropFilter: "blur(16px)",
        transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
        boxShadow: hovered
          ? `0 0 40px rgba(${TEAL},0.1), inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 40px rgba(0,0,0,0.4)`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
