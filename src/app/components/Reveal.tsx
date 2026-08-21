import { useEffect, useRef } from "react";

export function Reveal({ children, className = "", style = {} as React.CSSProperties }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { el.classList.add("in"); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { 
        if (e.isIntersecting) { 
          e.target.classList.add("in"); 
          io.unobserve(e.target); 
        } 
      });
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={style}>{children}</div>;
}
