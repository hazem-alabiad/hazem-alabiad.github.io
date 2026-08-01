import { useState, useEffect } from "react";

type Theme = "dark" | "light" | "auto";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("portfolio-theme");
    return (stored as Theme) || "dark";
  });

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

  const cycle: Theme[] = ["dark", "light", "auto"];
  const next = cycle[(cycle.indexOf(theme) + 1) % cycle.length];

  return (
    <button
      onClick={() => setTheme(next)}
      title={`Theme: ${theme} → ${next}`}
      aria-label="Toggle theme"
      style={{
        ...MONO, fontSize: 11, padding: "6px 10px", borderRadius: 8,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        color: "#6b6b82", cursor: "pointer", transition: "all 0.2s ease",
        display: "flex", alignItems: "center", gap: 5,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#2dd4bf"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(45,212,191,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#6b6b82"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
    >
      {theme === "dark" ? "◑" : theme === "light" ? "☀" : "◐"} {next}
    </button>
  );
}

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
