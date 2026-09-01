import { useEffect, useState, useRef } from "react";

const BOOT_LINES = [
  "[ OK ] Initializing neural interface…",
  "[ OK ] Loading personality matrix v2.6.0",
  "[ OK ] Mounting knowledge base: NLP / LLMs / CompLing",
  "[ OK ] Indexing production experience…",
  "[ OK ] Connecting to Tübingen research node",
  "[ OK ] Verifying cryptographic identity",
  "[ OK ] All systems nominal. Launching portfolio…",
];

export function BootScreen({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [wiping, setWiping] = useState(false);
  const launched = useRef(false);

  const launch = () => { 
    if (launched.current) return; 
    launched.current = true; 
    setWiping(true); 
    setTimeout(onDone, 600); 
  };

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => { 
      setLines((p) => [...p, BOOT_LINES[i]]); 
      i++; 
      if (i >= BOOT_LINES.length) clearInterval(iv); 
    }, 200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { 
      if (!e.repeat && (e.key === "Enter" || e.key === " ")) { 
        e.preventDefault(); 
        launch(); 
      } 
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div onClick={launch} style={{ position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", animation: wiping ? "boot-wipe 0.5s cubic-bezier(0.7,0,1,1) forwards" : "none", transformOrigin: "top" }}>
      <div style={{ fontFamily: "var(--font-mono)", textAlign: "center", padding: "0 28px" }}>
        <div style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.3em", marginBottom: 28 }}>HAZEM_ALABIAD // BOOT</div>
        <div style={{ textAlign: "left", display: "inline-block", minWidth: 280 }}>
          {lines.map((line, i) => (
            <div key={i} style={{ fontSize: 13, color: i === lines.length - 1 ? "var(--ink)" : "var(--ink-faint)", letterSpacing: "0.06em", lineHeight: 1.8 }}>
              {line}{i === lines.length - 1 && <span style={{ display: "inline-block", width: 7, height: 13, background: "var(--amber)", marginLeft: 6, verticalAlign: "middle", animation: "blink 1s step-end infinite" }} />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 28, height: 2, background: "var(--rule)", borderRadius: 2, overflow: "hidden", maxWidth: 360, margin: "28px auto 0" }}>
          <div style={{ height: "100%", width: `${(lines.length / BOOT_LINES.length) * 100}%`, background: "var(--amber)", transition: "width 0.2s ease" }} />
        </div>
        <div style={{ marginTop: 24, fontSize: 10, letterSpacing: "0.25em", color: "var(--ink-faint)" }}>ENTER ↵ / SPACE / CLICK TO LAUNCH</div>
      </div>
    </div>
  );
}
