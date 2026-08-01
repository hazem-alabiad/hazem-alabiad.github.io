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
  | { kind: "out-anchor"; text: string; href: string };

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
  return (
    <div style={{ ...MONO, fontSize: 12.5, color: line.text ? "#94a3b8" : "#0d0d18", whiteSpace: "pre-wrap", marginBottom: 6 }}>
      {line.text}
    </div>
  );
}

export default function Terminal({ name, email, github, linkedin, location, skills }: TerminalProps) {
  const [history, setHistory] = useState<OutputLine[]>([]);
  const [typed, setTyped] = useState("");
  const [booted, setBooted] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [bootIdx, setBootIdx] = useState(0);

  useEffect(() => {
    if (bootIdx < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIdx(i => i + 1), 260);
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
    const arg = cmd.split(/\s+/).slice(1).join(" ");
    const out: OutputLine[] = [];
    switch (cmd.split(/\s+/)[0]) {
      case "help":
        out.push({ kind: "out", text: "Available commands:" });
        out.push({ kind: "out", text: "  about        — who am I" });
        out.push({ kind: "out", text: "  skills       — tech stack" });
        out.push({ kind: "out", text: "  contact      — reach me" });
        out.push({ kind: "out", text: "  location     — current base" });
        out.push({ kind: "out", text: "  clear        — wipe terminal" });
        break;
      case "about":
        out.push({ kind: "out", text: `Software engineer + NLP/LLM researcher. ${location}.` });
        out.push({ kind: "out", text: "M.A. Computational Linguistics — building the bridge" });
        out.push({ kind: "out", text: "between production-grade UI engineering and intelligent systems." });
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
        out.push({ kind: "out", text: arg });
        break;
      default:
        out.push({ kind: "out", text: `command not found: ${cmd.split(/\s+/)[0]}. Type 'help'.` });
    }
    setHistory(h => [...h, ...out]);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    runCommand(typed);
    setTyped("");
  }

  return (
    <div onClick={() => inputRef.current?.focus()}
      style={{
        borderRadius: 16, overflow: "hidden", cursor: "text",
        background: "rgba(10,12,22,0.85)", border: "1px solid rgba(45,212,191,0.18)",
        boxShadow: "0 0 60px rgba(45,212,191,0.07), inset 0 1px 0 rgba(255,255,255,0.05)",
        backdropFilter: "blur(16px)",
      }}>
      {/* Title bar */}
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

      {/* Body */}
      <div ref={bodyRef} style={{
        height: 360, overflowY: "auto", padding: "18px 20px",
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
