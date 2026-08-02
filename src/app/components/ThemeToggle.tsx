import { useState, useEffect } from "react";

type Theme = "dark" | "light" | "auto";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("portfolio-theme");
    return (stored as Theme) || "dark";
  });
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    if (theme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("portfolio-theme", theme);
  }, [theme]);

  useEffect(() => {
    const sync = () => {
      const cls = document.documentElement.classList;
      setIsDark(cls.contains("dark") || (!cls.contains("light") && window.matchMedia("(prefers-color-scheme: dark)").matches));
    };
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const cycle: Theme[] = ["dark", "light", "auto"];
  const next = cycle[(cycle.indexOf(theme) + 1) % cycle.length];

  const icons = { dark: "◑", light: "☀", auto: "◐" } as const;

  return (
    <>
      <button
        onClick={() => setTheme(next)}
        title={`Theme: ${theme} → ${next}`}
        aria-label="Toggle theme"
        style={{
          ...MONO, fontSize: 12, padding: "7px 12px", borderRadius: 8,
          background: isDark ? "rgba(255,255,255,0.04)" : "rgba(20,20,31,0.05)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(20,20,31,0.12)"}`,
          color: isDark ? "#7a7a9a" : "#5d5d75", cursor: "pointer", transition: "all 0.25s cubic-bezier(0.16,1,0.3,1)",
          display: "flex", alignItems: "center", gap: 5, position: "relative", overflow: "hidden",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#0d9488"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(13,148,136,0.35)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = isDark ? "#7a7a9a" : "#5d5d75"; (e.currentTarget as HTMLElement).style.borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(20,20,31,0.12)"; }}
      >
        <span className="theme-toggle-spin" style={{ display: "inline-flex" }}>{icons[theme]}</span> {next}
      </button>
      <style>{`
        .theme-toggle-spin { display: inline-flex; transition: transform 0.5s cubic-bezier(0.16,1,0.3,1); }
        button:hover .theme-toggle-spin { transform: rotate(180deg); }
        @keyframes themeShimmer { from { left: -80%; } to { left: 140%; } }
        button:hover::after {
          content: ""; position: absolute; top: -40%; bottom: -40%; left: -80%; width: 35%;
          transform: skewX(-25deg);
          background: linear-gradient(90deg, transparent, rgba(94,234,212,0.18), transparent);
          pointer-events: none; animation: themeShimmer 0.8s ease-in-out;
        }
      `}</style>
    </>
  );
}

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
