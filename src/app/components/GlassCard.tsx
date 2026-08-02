import { useRef } from "react";

const TEAL = "45,212,191";

export function GlassCard({ children, className = "", style = {}, hover = true }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; hover?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!hover || !ref.current || !glareRef.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 10;
    const ry = (px - 0.5) * 10;
    ref.current.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
    ref.current.style.borderColor = `rgba(${TEAL},0.35)`;
    ref.current.style.boxShadow = `0 0 44px rgba(${TEAL},0.14), inset 0 1px 0 rgba(255,255,255,0.07), 0 18px 50px rgba(0,0,0,0.45)`;
    glareRef.current.style.background = `radial-gradient(circle at ${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%, rgba(${TEAL},0.16), transparent 55%)`;
    glareRef.current.style.opacity = "1";
  }

  function onLeave() {
    if (!hover || !ref.current || !glareRef.current) return;
    ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)";
    ref.current.style.borderColor = "";
    ref.current.style.boxShadow = "";
    glareRef.current.style.opacity = "0";
  }

  return (
    <div
      ref={ref}
      className={`${className} glass-hover`}
      onMouseMove={onMove}
      onMouseEnter={onMove}
      onMouseLeave={onLeave}
      style={{
        position: "relative",
        background: "rgba(255,255,255,0.032)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16,
        backdropFilter: "blur(16px)",
        transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), border-color 0.25s ease, box-shadow 0.25s ease",
        transformStyle: "preserve-3d",
        willChange: "transform",
        ...style,
      }}
    >
      <div
        ref={glareRef}
        style={{
          position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none", opacity: 0,
          transition: "opacity 0.2s ease",
        }}
      />
      {children}
    </div>
  );
}
