import { useMemo } from "react";

export function BgGlyphs() {
  const glyphs = useMemo(() => {
    const chars = ["$", ">", "_", "01", "0x", "::", "#", "%", "@", "~", "λ", "π", "Ω", "EOF", ":=", "&&", "||", "√", "Δ", "µ"];
    const accents = ["", "", "", "", "", "var(--amber)", "", "", "", "var(--sage)", "", "", "var(--violet)", "", "", "", "", "", "", ""];
    return Array.from({ length: 18 }, (_, i) => ({
      ch: chars[i % chars.length],
      x: `${Math.random() * 100}%`,
      fs: `${9 + Math.random() * 6}px`,
      g: (0.03 + Math.random() * 0.025).toFixed(3),
      dur: `${22 + Math.random() * 20}s`,
      delay: `-${Math.random() * 40}s`,
      color: accents[i] || "var(--ink-faint)",
    }));
  }, []);
  
  return (
    <div className="bg-glyphs" aria-hidden="true">
      {glyphs.map((g, i) => (
        <span
          key={i}
          style={{ "--x": g.x, "--fs": g.fs, "--g": g.g, "--dur": g.dur, "--delay": g.delay, color: g.color } as React.CSSProperties}
        >
          {g.ch}
        </span>
      ))}
    </div>
  );
}
