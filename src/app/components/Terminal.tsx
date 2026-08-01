import { useState, useEffect, useRef } from "react";

const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface TerminalProps {
  name: string;
  email: string;
  github: string;
  linkedin: string;
  location: string;
  skills: string[];
}

type OutputLine =
  | { kind: "cmd"; text: string }
  | { kind: "out"; text: string }
  | { kind: "out-anchor"; text: string; href: string }
  | { kind: "error"; text: string };

const BOOT_LINES: OutputLine[] = [
  { kind: "out", text: "haOS v2050.7 — booting neural shell…" },
  { kind: "out", text: "init crypto.accel .................................................. OK" },
  { kind: "out", text: "mount language.cortex ............................................. OK" },
  { kind: "out", text: "load reactor.dist [react|node|ts|py] ................................ OK" },
  { kind: "out", text: "establish uplink — Tübingen, DE .................................... OK" },
  { kind: "out", text: "" },
  { kind: "out", text: "Type 'help' to explore the interface." },
];

function Line({ line }: { line: OutputLine }) {
  if (line.kind === "cmd") {
    return (
      <div style={{ ...MONO, fontSize: 12.5, color: "#d7f7ef", marginBottom: 6 }}>
        <span style={{ color: "#2dd4bf" }}>hazem@2050</span>
        <span style={{ color: "#5a5a78" }}>:</span>
        <span style={{ color: "#a78bfa" }}>~</span>
        <span style={{ color: "#5a5a78" }}>$ </span>
        <span>{line.text}</span>
      </div>
    );
  }
  if (line.kind === "out-anchor") {
    return (
      <a href={line.href} target="_blank" rel="noopener noreferrer"
        style={{ ...MONO, fontSize: 12.5, color: "#67e8f9", textDecoration: "none", display: "block", marginBottom: 6 }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = "underline"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = "none"}>
        {line.text}
      </a>
    );
  }
  if (line.kind === "error") {
    return (
      <div style={{ ...MONO, fontSize: 12.5, color: "#f87171", marginBottom: 6 }}>
        <span style={{ color: "#f87171" }}>error:</span> {line.text}
      </div>
    );
  }
  return (
    <div style={{ ...MONO, fontSize: 12.5, color: line.text ? "#94a3b8" : "#0d0d18", whiteSpace: "pre-wrap", marginBottom: 6 }}>
      {line.text}
    </div>
  );
}

const ALL_COMMANDS = ["help", "about", "skills", "contact", "location", "clear", "whoami", "echo", "banner", "projects", "experience", "education"];

export default function Terminal({ name, email, github, linkedin, location, skills }: TerminalProps) {
  const [history, setHistory] = useState<OutputLine[]>([]);
  const [typed, setTyped] = useState("");
  const [booted, setBooted] = useState(false);
  const [histIdx, setHistIdx] = useState(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [bootIdx, setBootIdx] = useState(0);

  useEffect(() => {
    if (bootIdx < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIdx(i => i + 1), 220);
      return () => clearTimeout(t);
    }
    setBooted(true);
  }, [bootIdx]);

  useEffect(() => {
    setHistory(BOOT_LINES.slice(0, bootIdx));
  }, [bootIdx]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [history, typed]);

  function runCommand(raw: string) {
    const cmd = raw.trim();
    setHistory(h => [...h, { kind: "cmd", text: cmd }]);
    if (!cmd) return;
    const parts = cmd.split(/\s+/);
    const cmdName = parts[0];
    const arg = parts.slice(1).join(" ");
    const out: OutputLine[] = [];
    switch (cmdName) {
      case "help":
        out.push({ kind: "out", text: "Commands:" });
        out.push({ kind: "out", text: "  help        — this list" });
        out.push({ kind: "out", text: "  about       — who am I" });
        out.push({ kind: "out", text: "  skills      — tech stack" });
        out.push({ kind: "out", text: "  projects    — featured work" });
        out.push({ kind: "out", text: "  experience  — work history" });
        out.push({ kind: "out", text: "  education   — academic path" });
        out.push({ kind: "out", text: "  contact     — reach me" });
        out.push({ kind: "out", text: "  location    — current base" });
        out.push({ kind: "out", text: "  banner      — full intro" });
        out.push({ kind: "out", text: "  echo <msg>  — repeat text" });
        out.push({ kind: "out", text: "  whoami      — display name" });
        out.push({ kind: "out", text: "  clear       — wipe terminal" });
        out.push({ kind: "out", text: "  ↑/↓         — history navigation" });
        out.push({ kind: "out", text: "  Tab         — autocomplete" });
        break;
      case "about":
        out.push({ kind: "out", text: `Software engineer + NLP/LLM researcher. ${location}.` });
        out.push({ kind: "out", text: "M.A. Computational Linguistics — building the bridge" });
        out.push({ kind: "out", text: "between production UI engineering and intelligent systems." });
        break;
      case "skills":
        skills.forEach(s => out.push({ kind: "out", text: `  ▸ ${s}` }));
        break;
      case "contact":
        out.push({ kind: "out-anchor", text: `  ✉ ${email}`, href: `mailto:${email}` });
        out.push({ kind: "out-anchor", text: `  ⌥ github.com/hazem-alabiad`, href: `https://${github}` });
        out.push({ kind: "out-anchor", text: `  ➤ linkedin.com/in/hazemalabiad`, href: `https://${linkedin}` });
        break;
      case "location":
        out.push({ kind: "out", text: location });
        break;
      case "clear":
        setHistory([]);
        return;
      case "whoami":
        out.push({ kind: "out", text: name });
        break;
      case "echo":
        out.push({ kind: "out", text: arg || "" });
        break;
      case "banner":
        out.push({ kind: "out", text: "╔══════════════════════════════════╗" });
        out.push({ kind: "out", text: `║  ${name.padEnd(30)} ║` });
        out.push({ kind: "out", text: `║  ${location.padEnd(30)} ║` });
        out.push({ kind: "out", text: "╚══════════════════════════════════╝" });
        break;
      case "projects":
        out.push({ kind: "out", text: "Multiword Expressions in Arabic (2026)" });
        out.push({ kind: "out", text: "Content Rating System (2022)" });
        out.push({ kind: "out", text: "Taxi Tip Estimator (2021)" });
        out.push({ kind: "out", text: "Automated Essay Grading (2019)" });
        break;
      case "experience":
        out.push({ kind: "out", text: "IBM (2024–2026) · Getir (2022–2024)" });
        out.push({ kind: "out", text: "Arianna Suisse (2021–2022) · Bayzat (2019)" });
        break;
      case "education":
        out.push({ kind: "out", text: "M.A. Computational Linguistics — Tübingen" });
        out.push({ kind: "out", text: "B.Sc. Computer Engineering — Hacettepe" });
        break;
      case "Tab":
        const match = ALL_COMMANDS.filter(c => c.startsWith(arg));
        if (match.length === 1) {
          setTyped(match[0]);
          out.push({ kind: "out", text: `→ ${match[0]}` });
        } else if (match.length > 1) {
          out.push({ kind: "out", text: match.join("  ")});
        }
        break;
      default:
        out.push({ kind: "error", text: `command not found: ${cmdName}. Type 'help'.` });
    }
    setHistory(h => [...h, ...out]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runCommand(typed);
    setTyped("");
    setHistIdx(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.filter(l => l.kind === "cmd").length > 0) {
        const cmds = history.filter(l => l.kind === "cmd").map(l => (l as Extract<OutputLine, { kind: "cmd" }>).text);
        const newIdx = histIdx === -1 ? cmds.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(newIdx);
        setTyped(cmds[newIdx] ?? "");
      }
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const cmds = history.filter(l => l.kind === "cmd").map(l => (l as Extract<OutputLine, { kind: "cmd" }>).text);
      const newIdx = histIdx + 1;
      if (newIdx >= cmds.length) { setHistIdx(-1); setTyped(""); }
      else { setHistIdx(newIdx); setTyped(cmds[newIdx] ?? ""); }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      runCommand(typed + "Tab");
      setTyped("");
    }
  }

  return (
    <div onClick={() => inputRef.current?.focus()}
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "text",
        background: "rgba(10,12,22,0.85)", border: "1px solid rgba(45,212,191,0.18)",
        boxShadow: "0 0 60px rgba(45,212,191,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
      }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 16px",
        background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f87171" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#34d399" }} />
        <span style={{ ...MONO, fontSize: 11, color: "#5a5a78", marginLeft: 8 }}>
          hazem@2050: ~/portfolio
        </span>
      </div>

      <div ref={bodyRef} style={{
        height: 380, overflowY: "auto", padding: "18px 20px",
        scrollbarWidth: "thin", scrollbarColor: "#2dd4bf44 transparent",
      }}>
        {history.map((line, i) => <Line key={i} line={line} />)}
        {booted && (
          <form onSubmit={onSubmit} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ ...MONO, fontSize: 12.5, color: "#2dd4bf" }}>hazem@2050</span>
            <span style={{ ...MONO, fontSize: 12.5, color: "#5a5a78" }}>:</span>
            <span style={{ ...MONO, fontSize: 12.5, color: "#a78bfa" }}>~</span>
            <span style={{ ...MONO, fontSize: 12.5, color: "#5a5a78" }}>$ </span>
            <input
              ref={inputRef}
              value={typed}
              onChange={e => setTyped(e.target.value)}
              onKeyDown={onKeyDown}
              style={{
                ...MONO, fontSize: 12.5, color: "#d7f7ef", background: "transparent",
                border: "none", outline: "none", flex: 1, caretColor: "#2dd4bf",
              }}
              spellCheck={false}
              autoComplete="off"
              aria-label="Terminal command input"
            />
            <span style={{ width: 8, height: 15, background: "#2dd4bf", display: "inline-block", animation: "termBlink 1s steps(2) infinite", opacity: 0.9 }} />
          </form>
        )}
        {!booted && (
          <span style={{ width: 8, height: 15, background: "#2dd4bf", display: "inline-block", animation: "termBlink 1s steps(2) infinite", opacity: 0.9 }} />
        )}
      </div>
    </div>
  );
}
