import React, { useEffect, useRef, useState } from "react";
import hazemPhoto from "@/imports/ADB3B9AC-C855-4126-A54C-3D6BF8705288.jpeg";
// @ts-ignore
import cvPdf from "@/imports/Hazem-Alabiad-CV.pdf";
import CmsEditor from "@/CmsEditor";
import { loadContent, saveContent, resetContent, DEFAULT_CONTENT, type CmsContent } from "@/cms";
import {
  Github,
  Mail,
  ArrowUpRight,
  ChevronDown,
  Brain,
  Code2,
  Database,
  Globe,
  MapPin,
  GraduationCap,
  Briefcase,
  PencilLine,
  Lock,
  LockOpen,
  X,
  RotateCcw,
  Linkedin,
  FileDown,
  Loader,
  CheckCheck,
} from "lucide-react";

// ─── Scroll hooks ─────────────────────────────────────────────────────────────

function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return p;
}

function useScrollVelocity() {
  const vel = useRef(0);
  const last = useRef(0);
  const raf  = useRef(0);
  useEffect(() => {
    const fn = () => {
      vel.current = window.scrollY - last.current;
      last.current = window.scrollY;
    };
    window.addEventListener("scroll", fn, { passive: true });
    const decay = () => { vel.current *= 0.85; raf.current = requestAnimationFrame(decay); };
    raf.current = requestAnimationFrame(decay);
    return () => { window.removeEventListener("scroll", fn); cancelAnimationFrame(raf.current); };
  }, []);
  return vel;
}

// ─── Custom cursor ─────────────────────────────────────────────────────────────

function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos  = useRef({ x: -200, y: -200 });
  const lag  = useRef({ x: -200, y: -200 });
  const vel  = useRef({ x: 0, y: 0 });
  const prev = useRef({ x: -200, y: -200 });
  const raf  = useRef(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      const t = e.target as HTMLElement;
      setHovered(!!(t.closest("button, a, [data-magnetic]")));
    };
    window.addEventListener("mousemove", move);

    const tick = () => {
      vel.current.x = pos.current.x - prev.current.x;
      vel.current.y = pos.current.y - prev.current.y;
      prev.current = { ...pos.current };

      lag.current.x += (pos.current.x - lag.current.x) * 0.1;
      lag.current.y += (pos.current.y - lag.current.y) * 0.1;

      const speed = Math.sqrt(vel.current.x ** 2 + vel.current.y ** 2);
      const angle = Math.atan2(vel.current.y, vel.current.x) * (180 / Math.PI);
      const scaleX = 1 + Math.min(speed * 0.06, 1.4);
      const scaleY = 1 / scaleX;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${pos.current.x - 3}px, ${pos.current.y - 3}px)`;
      }
      if (ringRef.current) {
        const s = hovered ? 1.8 : 1;
        ringRef.current.style.transform =
          `translate(${lag.current.x - 18}px, ${lag.current.y - 18}px) rotate(${angle}deg) scaleX(${scaleX * s}) scaleY(${scaleY * s})`;
        ringRef.current.style.borderColor = hovered ? "rgba(157,78,221,0.8)" : "rgba(0,240,255,0.5)";
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf.current); };
  }, [hovered]);

  return (
    <>
      <div ref={dotRef} style={{ position: "fixed", top: 0, left: 0, width: 6, height: 6, borderRadius: "50%", background: "#00f0ff", pointerEvents: "none", zIndex: 9999, mixBlendMode: "screen", transition: "transform 0.05s linear" }} />
      <div ref={ringRef} style={{ position: "fixed", top: 0, left: 0, width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(0,240,255,0.5)", pointerEvents: "none", zIndex: 9998, transition: "border-color 0.2s" }} />
    </>
  );
}

// ─── Scroll progress bar ───────────────────────────────────────────────────────

function ScrollProgressBar() {
  const p = useScrollProgress();
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 9990, background: "rgba(0,240,255,0.07)" }}>
      <div style={{ height: "100%", width: `${p * 100}%`, background: "linear-gradient(90deg, #00f0ff, #9d4edd)", transition: "width 0.05s linear", boxShadow: "0 0 8px rgba(0,240,255,0.6)" }} />
    </div>
  );
}

// ─── CRT scanline overlay ─────────────────────────────────────────────────────

function CRTOverlay() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9980, overflow: "hidden" }}>
      {/* moving scanline */}
      <div style={{ position: "absolute", left: 0, right: 0, height: 120, background: "linear-gradient(to bottom, transparent, rgba(0,240,255,0.025) 50%, transparent)", animation: "scanline-sweep 8s linear infinite" }} />
      {/* static horizontal lines */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)", backgroundSize: "100% 4px" }} />
    </div>
  );
}

// ─── Wipe-reveal heading ──────────────────────────────────────────────────────

function WipeHeading({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${visible ? "wipe-in" : ""} ${className ?? ""}`} style={{ ...style, clipPath: visible ? undefined : "inset(0 100% 0 0)" }}>
      {children}
    </div>
  );
}

// ─── Magnetic button ──────────────────────────────────────────────────────────

function MagneticWrap({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.22;
    const y = (e.clientY - r.top - r.height / 2) * 0.22;
    el.style.transform = `translate(${x}px, ${y}px)`;
    el.style.transition = "transform 0.1s ease";
  };
  const onLeave = () => {
    if (ref.current) { ref.current.style.transform = "translate(0,0)"; ref.current.style.transition = "transform 0.5s ease"; }
  };
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}>{children}</div>;
}

// ─── Particle Field ──────────────────────────────────────────────────────────

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const state = {
      particles: [] as Array<{ x: number; y: number; vx: number; vy: number; r: number; t: number; a: number }>,
      mouse: { x: -9999, y: -9999 },
      scanY: 0,
      raf: 0,
    };
    function init() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      state.particles = Array.from({ length: 110 }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: Math.random() * 1.8 + 0.4,
        t: Math.random(),
        a: Math.random() * 0.5 + 0.25,
      }));
    }
    function tick() {
      const W = canvas!.width, H = canvas!.height;
      ctx!.fillStyle = "rgba(5,8,20,0.18)";
      ctx!.fillRect(0, 0, W, H);
      ctx!.lineWidth = 0.5;
      ctx!.strokeStyle = "rgba(0,240,255,0.04)";
      const GS = 65;
      for (let x = 0; x < W; x += GS) { ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, H); ctx!.stroke(); }
      for (let y = 0; y < H; y += GS) { ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke(); }
      state.scanY = (state.scanY + 0.55) % H;
      const sg = ctx!.createLinearGradient(0, state.scanY - 80, 0, state.scanY + 80);
      sg.addColorStop(0, "rgba(0,240,255,0)");
      sg.addColorStop(0.5, "rgba(0,240,255,0.032)");
      sg.addColorStop(1, "rgba(0,240,255,0)");
      ctx!.fillStyle = sg;
      ctx!.fillRect(0, state.scanY - 80, W, 160);
      const { particles, mouse } = state;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) { p.vx += (dx / dist) * 0.013; p.vy += (dy / dist) * 0.013; }
        p.vx *= 0.99; p.vy *= 0.99;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const r = Math.round(p.t * 157), g = Math.round(240 - p.t * 162), b = Math.round(255 - p.t * 34);
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},${p.a})`; ctx!.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dd = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
          if (dd < 115) {
            ctx!.strokeStyle = `rgba(${r},${g},${b},${(1 - dd / 115) * 0.2})`;
            ctx!.lineWidth = 0.4;
            ctx!.beginPath(); ctx!.moveTo(p.x, p.y); ctx!.lineTo(q.x, q.y); ctx!.stroke();
          }
        }
      }
      state.raf = requestAnimationFrame(tick);
    }
    init(); tick();
    const onResize = () => init();
    const onMove = (e: MouseEvent) => { state.mouse.x = e.clientX; state.mouse.y = e.clientY; };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Reveal hook ─────────────────────────────────────────────────────────────

function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── CV Data ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  heroTagline:
    "Software Engineer with 6+ years of experience, M.A. student in Computational Linguistics at Tübingen. Bridging production-grade full-stack engineering with AI, NLP, and LLM research.",
  bio1:
    "Software Engineer with 6+ years of experience building production-ready, maintainable systems and pixel-perfect UIs using React, Next.js, TypeScript, and modern tooling. Experienced in leading cross-functional teams, improving developer experience, and delivering design-driven applications at scale.",
  bio2:
    "Currently pursuing an M.A. in Computational Linguistics at the University of Tübingen and working as a Student Assistant at IWM & the Autonomous Learning Lab (Uni Tübingen), focusing on AI, ML, LLMs, NLP, and Cognitive Science — bridging software engineering and intelligent systems. Open to Working Student & internship roles in NLP, AI/ML, and LLMs — Tübingen, Stuttgart, or remote.",
};

// ─── Style helpers (module-level so all components can use them) ──────────────

const mono = (sz: number, color = "#9ab8d0", extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: '"JetBrains Mono", monospace', fontSize: sz, color, ...extra,
});
const raj = (sz: number, color = "#e2e8f4"): React.CSSProperties => ({
  fontFamily: '"Rajdhani", sans-serif', fontSize: sz, fontWeight: 700, color,
});
const body = (sz: number, color = "#9ab8cc"): React.CSSProperties => ({
  fontFamily: '"Outfit", sans-serif', fontSize: sz, color, lineHeight: 1.8,
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkillTicker() {
  const items = [
    "React.js", "TypeScript", "GraphQL", "Node.js", "Python",
    "LLMs", "NLP", "TensorFlow", "Docker", "Elasticsearch",
    "Next.js", "Corpus Linguistics", "Fine-tuning", "WebSocket", "Playwright",
    "React.js", "TypeScript", "GraphQL", "Node.js", "Python",
    "LLMs", "NLP", "TensorFlow", "Docker", "Elasticsearch",
    "Next.js", "Corpus Linguistics", "Fine-tuning", "WebSocket", "Playwright",
  ];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(0,240,255,0.08)", borderBottom: "1px solid rgba(0,240,255,0.08)", padding: "14px 0", position: "relative", zIndex: 10 }}>
      <div style={{ display: "flex", gap: 40, width: "max-content", animation: "ticker 28s linear infinite" }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.25em", color: i % 3 === 0 ? "#00f0ff" : i % 3 === 1 ? "#9d4edd" : "#4d6b8a", textTransform: "uppercase", whiteSpace: "nowrap", userSelect: "none" }}>
            {item} <span style={{ color: "rgba(0,240,255,0.2)", margin: "0 4px" }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FloatingCode() {
  const snippets = [
    "const model = await loadLLM()",
    "embed(corpus, d=768)",
    "∇L(θ) → optimize",
    "SELECT * FROM neurons",
    "git push origin 2050",
    "accuracy: 0.9742",
    "docker run --gpu",
    "epoch 42/100",
  ];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {snippets.map((s, i) => {
        const anims = ["float-a", "float-b", "float-c"];
        const dur = [8, 11, 9, 13, 10, 12, 7, 14][i];
        const delay = [0, 2, 4, 1, 6, 3, 5, 7][i];
        const left = [8, 75, 20, 85, 12, 65, 40, 55][i];
        const top  = [15, 25, 60, 45, 80, 70, 35, 88][i];
        return (
          <div key={i} style={{
            position: "absolute", left: `${left}%`, top: `${top}%`,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
            color: i % 2 === 0 ? "rgba(0,240,255,0.07)" : "rgba(157,78,221,0.07)",
            letterSpacing: "0.1em", whiteSpace: "nowrap",
            animation: `${anims[i % 3]} ${dur}s ease-in-out ${delay}s infinite`,
          }}>
            {s}
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ num, label }: { num: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="flex items-center gap-4 mb-8">
      <span className={`neon-flicker ${vis ? "glitch-enter" : ""}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: "0.28em", color: "rgba(0,240,255,0.7)", textTransform: "uppercase" as const }}>
        MODULE_{num}
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(0,240,255,0.3), transparent)", transform: vis ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 1s ease 0.2s" }} />
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: "0.2em", color: "rgba(0,240,255,0.5)", textTransform: "uppercase" as const, opacity: vis ? 1 : 0, transition: "opacity 0.6s ease 0.8s" }}>
        {label}
      </span>
    </div>
  );
}

function SkillBar({ label, level, visible, delay }: { label: string; level: number; visible: boolean; delay: number }) {
  const segments = 8;
  const filled = Math.round((level / 100) * segments);
  const tier = level >= 90 ? "EXPERT" : level >= 78 ? "ADVANCED" : level >= 65 ? "PROFICIENT" : "COMPETENT";
  return (
    <div>
      <div className="flex justify-between items-baseline">
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: "#b0cede" }}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "flex", gap: 2.5 }}>
            {Array.from({ length: segments }).map((_, i) => (
              <span key={i}
                style={{
                  width: 6, height: 10,
                  background: i < filled && visible ? "linear-gradient(180deg, #00f0ff, #9d4edd)" : "#0f1624",
                  transition: "background 0.5s ease, box-shadow 0.5s ease",
                  transitionDelay: `${delay + i * 70}ms`,
                  boxShadow: i < filled && visible ? "0 0 6px rgba(0,240,255,0.35)" : "none",
                  opacity: visible ? 1 : 0,
                }}
              />
            ))}
          </span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8.5, letterSpacing: "0.16em", color: level >= 78 ? "#00f0ff" : "#6b8fab" }}>{tier}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Tilt Card ────────────────────────────────────────────────────────────────

function TiltCard({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const raf = useRef(0);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
      el.style.transition = "transform 0.08s ease";
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(raf.current);
    if (ref.current) {
      ref.current.style.transform = "perspective(700px) rotateY(0deg) rotateX(0deg) scale(1)";
      ref.current.style.transition = "transform 0.5s ease";
    }
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transformStyle: "preserve-3d", willChange: "transform", ...style }}
      className={className}>
      {children}
    </div>
  );
}

// ─── Count Up ─────────────────────────────────────────────────────────────────

function CountUp({ to, suffix = "", duration = 1400 }: { to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.round(ease * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── CV Download Button ────────────────────────────────────────────────────────

const MATRIX_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@%&!?><";

function CVDownloadButton({ cvUrl }: { cvUrl?: string | null }) {
  type Phase = "idle" | "init" | "transfer" | "done";
  const [phase, setPhase]     = useState<Phase>("idle");
  const [pct, setPct]         = useState(0);
  const [logLines, setLog]    = useState<string[]>([]);
  const [scramble, setScramble] = useState("DOWNLOAD CV");
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; vx: number; vy: number; life: number }[]>([]);
  const btnRef  = useRef<HTMLButtonElement>(null);
  const raf     = useRef(0);
  const pctRef  = useRef(0);

  const pushLog = (line: string) =>
    setLog((prev) => [...prev.slice(-4), line]);

  const spawnParticles = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setParticles(Array.from({ length: 18 }, (_, i) => ({
      id: Date.now() + i,
      x: r.width / 2,
      y: r.height / 2,
      vx: (Math.random() - 0.5) * 140,
      vy: (Math.random() - 0.5) * 80 - 30,
      life: 1,
    })));
    setTimeout(() => setParticles([]), 900);
  };

  const handleClick = () => {
    if (phase !== "idle") return;
    setPhase("init");
    setPct(0);
    pctRef.current = 0;
    setLog([]);

    // Phase 1 — scramble label
    let t = 0;
    const scrambleIv = setInterval(() => {
      const rand = Array.from({ length: 11 }, () =>
        MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
      ).join("");
      setScramble(rand);
      t++;
      if (t > 14) { clearInterval(scrambleIv); setScramble("TRANSFERRING"); }
    }, 60);

    // Phase 2 — logs + progress
    setTimeout(() => {
      setPhase("transfer");
      pushLog("> AUTH: RSA-4096 verified");
      setTimeout(() => pushLog("> ENCRYPT: AES-256-GCM"), 260);
      setTimeout(() => pushLog("> COMPRESS: zstd level-19"), 520);
      setTimeout(() => pushLog("> TRANSFER: chunking file…"), 780);

      const start = performance.now();
      const DURATION = 1800;
      const tick = (now: number) => {
        const raw = (now - start) / DURATION;
        const ease = raw < 1 ? 1 - Math.pow(1 - raw, 2.5) : 1;
        // add jitter
        const jitter = Math.sin(now * 0.04) * 0.015;
        pctRef.current = Math.min(Math.round((ease + jitter) * 100), 100);
        setPct(pctRef.current);
        if (pctRef.current < 100) {
          raf.current = requestAnimationFrame(tick);
        } else {
          // Done
          setPhase("done");
          setScramble("DOWNLOAD COMPLETE");
          pushLog("> STATUS: 200 OK ✓");
          spawnParticles();
          const a = document.createElement("a");
          a.href = (cvUrl as string) || (cvPdf as string);
          a.download = "Hazem-Alabiad-CV.pdf";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => {
            setPhase("idle");
            setScramble("DOWNLOAD CV");
            setPct(0);
            setLog([]);
          }, 3200);
        }
      };
      raf.current = requestAnimationFrame(tick);
    }, 950);
  };

  const isActive = phase !== "idle";
  const borderCol = phase === "done" ? "#28c840" : phase === "transfer" ? "#00f0ff" : "rgba(0,240,255,0.35)";

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className="group relative overflow-hidden flex flex-col gap-0 transition-all duration-400"
      style={{
        padding: 0,
        border: `1px solid ${borderCol}`,
        background: isActive ? "rgba(0,240,255,0.05)" : "rgba(0,240,255,0.03)",
        cursor: phase === "idle" ? "none" : "default",
        minWidth: 300,
        boxShadow: phase === "transfer" ? "0 0 24px rgba(0,240,255,0.12)" : phase === "done" ? "0 0 28px rgba(40,200,64,0.2)" : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* floating particles */}
      {particles.map((p) => (
        <div key={p.id} style={{
          position: "absolute", left: p.x, top: p.y, width: 3, height: 3,
          borderRadius: "50%", background: p.id % 3 === 0 ? "#9d4edd" : "#00f0ff",
          pointerEvents: "none",
          animation: "none",
          transition: "transform 0.8s cubic-bezier(0,.8,.4,1), opacity 0.8s ease",
          transform: `translate(${p.vx}px, ${p.vy}px)`,
          opacity: 0,
        }} />
      ))}

      {/* scan line on idle hover */}
      {phase === "idle" && (
        <div className="absolute left-0 right-0 h-px pointer-events-none opacity-0 group-hover:opacity-100"
          style={{ background: "linear-gradient(90deg,transparent,#00f0ff,transparent)", top: "40%", animation: "scan-cv 1.4s linear infinite" }} />
      )}

      {/* top row */}
      <div className="flex items-center gap-4 w-full" style={{ padding: "14px 20px" }}>
        {/* icon box */}
        <div style={{ width: 38, height: 38, border: `1px solid ${borderCol}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: phase === "done" ? "#28c840" : "#00f0ff", transition: "border-color 0.3s, color 0.3s", position: "relative" }}>
          {phase === "idle"     && <FileDown size={15} />}
          {phase === "init"     && <Loader size={15} style={{ animation: "spin 0.5s linear infinite" }} />}
          {phase === "transfer" && <Loader size={15} style={{ animation: "spin 0.35s linear infinite", color: "#00f0ff" }} />}
          {phase === "done"     && <CheckCheck size={15} />}
          {/* corner accents */}
          {isActive && <>
            <div style={{ position: "absolute", top: -1, left: -1, width: 6, height: 6, borderTop: "2px solid #00f0ff", borderLeft: "2px solid #00f0ff" }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 6, height: 6, borderBottom: "2px solid #00f0ff", borderRight: "2px solid #00f0ff" }} />
          </>}
        </div>

        {/* label + sub */}
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.22em", color: phase === "done" ? "#28c840" : "#00f0ff", marginBottom: 3, transition: "color 0.3s" }}>
            {scramble}
          </div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: "#4d6b8a", letterSpacing: "0.12em" }}>
            Hazem-Alabiad-CV.pdf · 86 KB
          </div>
        </div>

        {/* percentage */}
        {isActive && (
          <div style={{ fontFamily: '"Audiowide", cursive', fontSize: 18, color: phase === "done" ? "#28c840" : "#00f0ff", minWidth: 52, textAlign: "right", transition: "color 0.3s" }}>
            {pct}<span style={{ fontSize: 10 }}>%</span>
          </div>
        )}
      </div>

      {/* progress track */}
      <div style={{ height: 2, background: "rgba(0,240,255,0.08)", width: "100%", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`,
          background: phase === "done"
            ? "linear-gradient(90deg,#28c840,#00f0ff)"
            : "linear-gradient(90deg,#00f0ff,#9d4edd,#00f0ff)",
          backgroundSize: "200% 100%",
          animation: phase === "transfer" ? "shimmer-text 1.2s linear infinite" : "none",
          transition: "width 0.06s linear, background 0.3s",
          boxShadow: phase === "transfer" ? "0 0 8px rgba(0,240,255,0.6)" : "none",
        }} />
        {/* chunked tick marks */}
        {[25, 50, 75].map((x) => (
          <div key={x} style={{ position: "absolute", left: `${x}%`, top: 0, width: 1, height: "100%", background: "rgba(0,240,255,0.15)" }} />
        ))}
      </div>

      {/* terminal log panel */}
      {logLines.length > 0 && (
        <div style={{ width: "100%", padding: "8px 20px 10px", borderTop: "1px solid rgba(0,240,255,0.08)", textAlign: "left" }}>
          {logLines.map((line, i) => (
            <div key={i} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: i === logLines.length - 1 ? "#b0cede" : "#4d6b8a", letterSpacing: "0.1em", lineHeight: 1.8, animation: "fade-rise 0.25s ease both" }}>
              {line}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Contact Form ─────────────────────────────────────────────────────────────

function ContactForm() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const [typing, setTyping] = useState(false);

  const handleSend = () => {
    if (!msg.trim()) return;
    const subject = encodeURIComponent(`Portfolio message from ${name || "a visitor"}`);
    const body = encodeURIComponent(`Name: ${name || "—"}\n\n${msg}`);
    window.location.href = `mailto:hazem.alabiad@icloud.com?subject=${subject}&body=${body}`;
    setSent(true);
    setTimeout(() => setSent(false), 4000);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSend();
  };

  return (
    <div className="p-6 flex flex-col gap-5" style={{ background: "#080f1c", border: "1px solid rgba(0,240,255,0.12)" }}>
      <div style={mono(9, "rgba(0,240,255,0.5)", { textTransform: "uppercase" as const, letterSpacing: "0.22em" })}>
        TRANSMIT_MESSAGE // hazem.alabiad@icloud.com
      </div>

      {/* Name */}
      <div>
        <div style={mono(9, "#6b8fab", { marginBottom: 6, letterSpacing: "0.18em", textTransform: "uppercase" as const })}>YOUR_NAME</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="optional"
          style={{
            width: "100%", background: "#050814", border: "1px solid rgba(0,240,255,0.15)",
            padding: "10px 14px", fontFamily: '"JetBrains Mono", monospace', fontSize: 13,
            color: "#e2e8f4", outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.45)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.15)")}
        />
      </div>

      {/* Message */}
      <div>
        <div style={mono(9, "#6b8fab", { marginBottom: 6, letterSpacing: "0.18em", textTransform: "uppercase" as const })}>MESSAGE</div>
        <div style={{ position: "relative" }}>
          <textarea
            value={msg}
            onChange={(e) => { setMsg(e.target.value); setTyping(e.target.value.length > 0); }}
            onKeyDown={handleKey}
            placeholder="Type your message here..."
            rows={5}
            style={{
              width: "100%", background: "#050814", border: "1px solid rgba(0,240,255,0.15)",
              padding: "10px 14px", fontFamily: '"JetBrains Mono", monospace', fontSize: 13,
              color: "#e2e8f4", outline: "none", resize: "vertical" as const, lineHeight: 1.7,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.45)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.15)")}
          />
          {typing && (
            <div style={{ position: "absolute", bottom: 10, right: 12, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: "rgba(0,240,255,0.35)" }}>
              ctrl+enter to send
            </div>
          )}
        </div>
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!msg.trim()}
        className="flex items-center justify-center gap-3 transition-all duration-300"
        style={{
          padding: "13px 24px", border: `1px solid ${sent ? "#28c840" : "rgba(0,240,255,0.4)"}`,
          background: sent ? "rgba(40,200,64,0.08)" : "rgba(0,240,255,0.04)",
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.22em",
          color: sent ? "#28c840" : "#00f0ff", cursor: msg.trim() ? "pointer" : "not-allowed",
          opacity: msg.trim() ? 1 : 0.4,
        }}
        onMouseEnter={(e) => { if (msg.trim() && !sent) (e.currentTarget as HTMLElement).style.background = "rgba(0,240,255,0.1)"; }}
        onMouseLeave={(e) => { if (!sent) (e.currentTarget as HTMLElement).style.background = "rgba(0,240,255,0.04)"; }}
      >
        {sent ? <><CheckCheck size={14} /> MESSAGE SENT ✓</> : <><Mail size={14} /> SEND MESSAGE</>}
      </button>

      <div style={mono(9, "#4d6b8a", { letterSpacing: "0.14em" })}>
        Opens your email client · no data stored
      </div>
    </div>
  );
}

// ─── CMS Button ───────────────────────────────────────────────────────────────

const CMS_TOKEN_KEY = "hazem-portfolio-cms-token";
const CMS_OWNER = "hazem-alabiad";

function CMSButton({ onUnlock, enabled, onDisable, onReset, onOpenEditor }: {
  onUnlock: () => void;
  enabled: boolean;
  onDisable: () => void;
  onReset: () => void;
  onOpenEditor: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pat, setPat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [authedAs, setAuthedAs] = useState("");

  const close = () => { setOpen(false); setError(""); setPat(""); setAuthedAs(""); };

  const saveToken = (token: string) => localStorage.setItem(CMS_TOKEN_KEY, token);

  const verify = async (token = pat.trim()) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("https://api.github.com/user", {
        headers: { Authorization: `token ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.login !== CMS_OWNER) {
          localStorage.removeItem(CMS_TOKEN_KEY);
          setError(`NOT AUTHORIZED. CMS is private to "@${CMS_OWNER}" only.`);
          setLoading(false);
          return;
        }
        saveToken(token);
        setAuthedAs(data.login || "authenticated");
        setTimeout(() => { onUnlock(); close(); }, 1200);
      } else if (res.status === 401) {
        localStorage.removeItem(CMS_TOKEN_KEY);
        setError("Invalid or expired PAT.");
      } else {
        setError(`Error ${res.status}. Check your token scope.`);
      }
    } catch {
      localStorage.removeItem(CMS_TOKEN_KEY);
      setError("Network error. Check your connection.");
    }
    setLoading(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem(CMS_TOKEN_KEY);
    if (stored) verify(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monoStyle: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: "0.2em" };

  return (
    <>
      {enabled ? (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <div style={{ ...monoStyle, color: "#00f0ff", background: "rgba(5,8,20,0.9)", border: "1px solid rgba(0,240,255,0.3)", padding: "4px 10px" }}>
            CMS_ACTIVE — CLICK TEXT TO EDIT
          </div>
          <div className="flex gap-2">
            <button onClick={onOpenEditor} title="Open full CV editor"
              style={{ ...monoStyle, color: "#00f0ff", background: "rgba(5,8,20,0.9)", border: "1px solid rgba(0,240,255,0.3)", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <PencilLine size={10} /> FULL EDITOR
            </button>
            <button onClick={onReset} title="Reset all CMS edits"
              style={{ ...monoStyle, color: "#9d4edd", background: "rgba(5,8,20,0.9)", border: "1px solid rgba(157,78,221,0.3)", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <RotateCcw size={10} /> RESET
            </button>
            <button onClick={onDisable}
              style={{ ...monoStyle, color: "#ff4757", background: "rgba(5,8,20,0.9)", border: "1px solid rgba(255,71,87,0.3)", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={10} /> LOCK
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} title="CMS — unlock editing"
          style={{ ...monoStyle, position: "fixed", bottom: 24, right: 24, zIndex: 50, color: "#9d4edd", background: "rgba(5,8,20,0.85)", border: "1px solid rgba(157,78,221,0.35)", padding: "8px 14px", cursor: "pointer", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: 6, opacity: 0.75 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
        >
          <PencilLine size={11} /> CMS
        </button>
      )}

      {open && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 100, background: "rgba(5,8,20,0.82)", backdropFilter: "blur(16px)" }}
          onClick={close}>
          <div className="relative p-8 w-full" style={{ maxWidth: 400, background: "#0b1020", border: "1px solid rgba(0,240,255,0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={close} style={{ position: "absolute", top: 16, right: 16, color: "#6b8fab", background: "none", border: "none", cursor: "pointer" }}>
              <X size={14} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Lock size={14} color="#9d4edd" />
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.22em", color: "#e2e8f4" }}>CMS_AUTHENTICATION</span>
            </div>
            <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: 13, color: "#8ab4c8", lineHeight: 1.7, marginBottom: 24 }}>
              Enter a GitHub Personal Access Token (classic) to verify identity and unlock inline text editing. Changes are saved to localStorage.
            </p>

            {authedAs ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(0,240,255,0.2)", padding: "12px 16px" }}>
                <LockOpen size={13} color="#00f0ff" />
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.15em", color: "#00f0ff" }}>
                  AUTHENTICATED AS: {authedAs.toUpperCase()}
                </span>
              </div>
            ) : (
              <>
                <input
                  type="password"
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && verify()}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  autoFocus
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 12,
                    background: "#080f1c",
                    border: "1px solid rgba(0,240,255,0.15)",
                    color: "#e2e8f4",
                    padding: "10px 14px",
                    outline: "none",
                    letterSpacing: "0.06em",
                    marginBottom: 12,
                    display: "block",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.15)")}
                />
                <button
                  onClick={verify}
                  disabled={loading || !pat.trim()}
                  style={{
                    width: "100%",
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 11,
                    letterSpacing: "0.2em",
                    padding: "10px",
                    background: loading || !pat.trim() ? "transparent" : "rgba(0,240,255,0.08)",
                    border: "1px solid rgba(0,240,255,0.3)",
                    color: loading || !pat.trim() ? "#6b8fab" : "#00f0ff",
                    cursor: loading || !pat.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "VERIFYING..." : "VERIFY & UNLOCK"}
                </button>
                {error && (
                  <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: "#ff4757", marginTop: 10, letterSpacing: "0.1em" }}>
                    ERR: {error}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Boot Screen ──────────────────────────────────────────────────────────────

const BOOT_LINES = [
  "[ OK ] Initializing neural interface…",
  "[ OK ] Loading personality matrix v2.6.0",
  "[ OK ] Mounting knowledge base: NLP / LLMs / CompLing",
  "[ OK ] Compiling 6+ years of experience…",
  "[ OK ] Connecting to Tübingen research node",
  "[ OK ] Verifying cryptographic identity",
  "[ OK ] All systems nominal. Launching portfolio…",
];

function BootScreen({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setLines((p) => [...p, BOOT_LINES[i]]);
      i++;
      if (i >= BOOT_LINES.length) {
        clearInterval(iv);
        setTimeout(() => setWiping(true), 400);
        setTimeout(() => onDone(), 1100);
      }
    }, 230);
    return () => clearInterval(iv);
  }, [onDone]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999, background: "#020510",
      display: "flex", flexDirection: "column", justifyContent: "center",
      padding: "10vh 8vw",
      animation: wiping ? "boot-wipe 0.55s cubic-bezier(0.7,0,1,1) forwards" : "none",
      transformOrigin: "top",
    }}>
      <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: "rgba(0,240,255,0.4)", letterSpacing: "0.3em", marginBottom: 32 }}>
        HAZEM_ALABIAD_OS // BOOT SEQUENCE
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: i === lines.length - 1 ? "#e2e8f4" : "rgba(0,240,255,0.55)", letterSpacing: "0.1em", animation: "boot-row 0.18s ease both" }}>
            {line}
            {i === lines.length - 1 && <span className="blink" style={{ marginLeft: 4, color: "#00f0ff" }}>▌</span>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 40, height: 1, background: "rgba(0,240,255,0.12)", overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${(lines.length / BOOT_LINES.length) * 100}%`,
          background: "linear-gradient(90deg,#00f0ff,#9d4edd)",
          transition: "width 0.22s ease",
          boxShadow: "0 0 10px rgba(0,240,255,0.5)",
        }} />
      </div>
    </div>
  );
}

// ─── Mouse Trail ──────────────────────────────────────────────────────────────

function MouseTrail() {
  type Dot = { id: number; x: number; y: number };
  const [dots, setDots] = useState<Dot[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    let last = 0;
    const move = (e: MouseEvent) => {
      const now = Date.now();
      if (now - last < 30) return;
      last = now;
      const id = counter.current++;
      setDots((p) => [...p.slice(-18), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setDots((p) => p.filter((d) => d.id !== id)), 600);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      {dots.map((d, i) => {
        const age = i / Math.max(dots.length - 1, 1);
        return (
          <div key={d.id} style={{
            position: "fixed", left: d.x - 2, top: d.y - 2,
            width: 4 + age * 3, height: 4 + age * 3,
            borderRadius: "50%",
            background: age > 0.5 ? "rgba(157,78,221,0.4)" : "rgba(0,240,255,0.35)",
            pointerEvents: "none", zIndex: 9997,
            animation: "trail-fade 0.55s ease forwards",
            transform: `scale(${0.4 + age * 0.6})`,
          }} />
        );
      })}
    </>
  );
}

// ─── Side Nav Dots ─────────────────────────────────────────────────────────────

const SECTIONS = ["home", "about", "experience", "projects", "skills", "contact"] as const;

function SideNavDots() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { threshold: 0.4 });
    SECTIONS.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 9000, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
      {SECTIONS.map((id) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
            title={id.toUpperCase()}
            style={{ cursor: "none", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0 }}>
            {isActive && (
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: "#00f0ff", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7, animation: "fade-rise 0.3s ease" }}>
                {id}
              </span>
            )}
            <div style={{
              height: 2,
              width: isActive ? 24 : 8,
              background: isActive ? "#00f0ff" : "rgba(0,240,255,0.25)",
              borderRadius: 1,
              transition: "all 0.3s ease",
              boxShadow: isActive ? "0 0 6px rgba(0,240,255,0.6)" : "none",
            }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Spotlight ─────────────────────────────────────────────────────────────────

function Spotlight({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [on, setOn] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect();
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)}
      className={className} style={{ position: "relative", ...style }}>
      {on && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, borderRadius: "inherit",
          background: `radial-gradient(300px circle at ${pos.x}% ${pos.y}%, rgba(0,240,255,0.07), transparent 60%)`,
          transition: "opacity 0.2s",
        }} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

const NAV = ["experience", "projects", "skills", "contact"] as const;

const VISIT_KEY = "hazem_portfolio_couter_v1";
const VISIT_URL = "https://countapi.mileshilliard.com/api/v1";

function countVisits() {
  try {
    const owner = !!localStorage.getItem(CMS_TOKEN_KEY);
    const counted = sessionStorage.getItem(VISIT_KEY);
    if (owner || counted) {
      return fetch(`${VISIT_URL}/get/hazemalabiad_portfolio_visits`).then((r) => r.json()).then((d) => d.value).catch(() => null);
    }
    sessionStorage.setItem(VISIT_KEY, "1");
    return fetch(`${VISIT_URL}/hit/hazemalabiad_portfolio_visits`).then((r) => r.json()).then((d) => d.value).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

export default function App() {
  const [booted, setBooted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [typeText, setTypeText] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cmsEnabled, setCmsEnabled] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [content, setContent] = useState<CmsContent>(() => loadContent());
  const [visits, setVisits] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    countVisits().then((v) => { if (alive && typeof v === "number") setVisits(v); });
    return () => { alive = false; };
  }, []);

  const scrollY = useScrollY();
  const expR = useReveal();
  const projectsR = useReveal();
  const skillsR = useReveal();
  const contactR = useReveal();

  const FULL = "FULL-STACK ENGINEER // AI & NLP // M.A. COMP. LINGUISTICS";

  const get = (key: keyof CmsContent, fallback: string) =>
    typeof content[key] === "string" && (content[key] as string).trim() !== ""
      ? (content[key] as string)
      : fallback;

  const save = (key: keyof CmsContent, value: string) => {
    setContent((prev) => {
      const next = { ...prev, [key]: value };
      saveContent(next);
      return next;
    });
  };

  const ep = (key: keyof CmsContent, fallback: string, base: React.CSSProperties = {}) =>
    cmsEnabled
      ? {
          contentEditable: true as const,
          suppressContentEditableWarning: true as const,
          onBlur: (e: React.FocusEvent<HTMLElement>) => save(key, e.currentTarget.textContent || ""),
          style: { ...base, outline: "1px dashed rgba(0,240,255,0.4)", cursor: "text" as const },
          title: `CMS: edit "${key}"`,
        }
      : { style: base };

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { setTypeText(FULL.slice(0, i)); i++; if (i > FULL.length) clearInterval(t); }, 46);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };


  const progress = useScrollProgress();
  // Subtle hue shift: cyan tint near top, violet near bottom
  const bgHue = `radial-gradient(ellipse at ${50 + progress * 20}% ${50 + progress * 30}%, rgba(${Math.round(157 * progress)},${Math.round(78 * progress)},${Math.round(221 * progress)},0.04) 0%, transparent 70%)`;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#050814", color: "#e2e8f4", cursor: "none" }}>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}
      {/* Scroll-reactive ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: bgHue, transition: "background 0.3s ease" }} />
      <CustomCursor />
      <MouseTrail />
      <ScrollProgressBar />
      <SideNavDots />
      <CRTOverlay />
      <ParticleField />

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-500"
        style={{ background: scrolled ? "rgba(5,8,20,0.88)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,240,255,0.1)" : "none" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => scrollTo("home")} style={mono(13, "#00f0ff", { letterSpacing: "0.2em" })} className="hover:opacity-75 transition-opacity">HAZ:ALABIAD</button>
          <div className="hidden md:flex items-center gap-8">
            {NAV.map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className="uppercase hover:opacity-100 transition-opacity" style={mono(12, "#b0cede", { letterSpacing: "0.2em" })}>{id}</button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] pulse-dot" />
            <span style={mono(9, "rgba(0,240,255,0.5)", { letterSpacing: "0.3em" })}>ONLINE_2026</span>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={mono(11, "#00f0ff")}>{menuOpen ? "CLOSE" : "MENU"}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 py-4 space-y-4" style={{ background: "rgba(5,8,20,0.96)", borderTop: "1px solid rgba(0,240,255,0.1)" }}>
            {NAV.map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left uppercase" style={mono(10, "#9ab8d0", { letterSpacing: "0.22em" })}>{id}</button>
            ))}
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section id="home" className="relative min-h-screen flex flex-col justify-center px-6 pt-20" style={{ zIndex: 10 }}>
        <FloatingCode />
        {/* Ambient orbs */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 pointer-events-none" style={{ borderRadius: "50%", background: "radial-gradient(circle, rgba(0,240,255,0.07) 0%, transparent 70%)", filter: "blur(40px)", animation: "orb-drift-1 14s ease-in-out infinite" }} />
        <div className="absolute bottom-1/3 left-1/5 w-64 h-64 pointer-events-none" style={{ borderRadius: "50%", background: "radial-gradient(circle, rgba(157,78,221,0.07) 0%, transparent 70%)", filter: "blur(40px)", animation: "orb-drift-2 18s ease-in-out infinite" }} />
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-8">
            <span style={mono(9, "rgba(0,240,255,0.45)", { letterSpacing: "0.35em" })}>NEURAL_ID::HAZ-2026-ALA-TBN</span>
            <div className="w-16 h-px" style={{ background: "rgba(0,240,255,0.18)" }} />
            <span style={mono(9, "rgba(157,78,221,0.45)", { letterSpacing: "0.3em" })}>2026.08.01</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left — identity, role, bio, CTAs, stats */}
            <div className="lg:col-span-7">
              <h1 className="glitch leading-none tracking-tight mb-4 select-none"
                style={{ fontFamily: '"Audiowide", cursive', fontSize: "clamp(3.2rem,10vw,8.5rem)", fontWeight: 400, color: "#e2e8f4", transform: `translateY(${scrollY * 0.18}px)`, willChange: "transform" }}>
                HAZEM<br /><span style={{ color: "#00f0ff" }}>ALABIAD</span>
              </h1>

              <div className="flex items-center gap-2 mb-8">
                <div className="blink w-2 h-5 bg-[#00f0ff]" />
                <p style={mono(14, "#b0cede", { letterSpacing: "0.14em", fontSize: "clamp(12px,1.6vw,15px)" })}>{typeText}</p>
              </div>

              <p {...ep("heroTagline", DEFAULTS.heroTagline, { ...body(20, "#b0cede"), maxWidth: 720, marginBottom: 20, transform: `translateY(${scrollY * 0.09}px)`, willChange: "transform" })}>
                {get("heroTagline", DEFAULTS.heroTagline)}
              </p>

              <p {...ep("bio1", DEFAULTS.bio1, { ...body(16, "#9ab8d0"), maxWidth: 720, marginBottom: 28 })}>
                {get("bio1", DEFAULTS.bio1)}
              </p>

              {/* ── Terminal / quick-facts card ── */}
              <div className="p-5" style={{ background: "#080f1c", border: "1px solid rgba(0,240,255,0.1)", fontFamily: '"JetBrains Mono", monospace', fontSize: 12, maxWidth: 720, marginBottom: 28 }}>
                <div className="flex gap-2 mb-4 items-center">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5f57" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#febc2e" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#28c840" }} />
                  <span className="blink" style={{ color: "#6b8fab", fontSize: 10, letterSpacing: "0.15em", marginLeft: 8 }}>hazem@tübingen:~$</span>
                </div>
                <div style={{ lineHeight: 1.9 }}>
                  <div><span style={{ color: "#9d4edd" }}>focus</span> <span style={{ color: "#e2e8f4" }}>=</span> <span style={{ color: "#00f0ff" }}>[</span></div>
                  <div style={{ paddingLeft: 20, color: "#8ab4c8" }}>"NLP", "LLMs", "Full-Stack Engineering",</div>
                  <div style={{ paddingLeft: 20, color: "#8ab4c8" }}>"Computational Linguistics", "ML/DL",</div>
                  <div><span style={{ color: "#00f0ff" }}>]</span></div>
                  <div style={{ marginTop: 4 }}><span style={{ color: "#9d4edd" }}>location</span> <span style={{ color: "#e2e8f4" }}>=</span> <span style={{ color: "#28c840" }}>"{get("factLocation", DEFAULT_CONTENT.factLocation)}"</span></div>
                  <div><span style={{ color: "#9d4edd" }}>status</span> <span style={{ color: "#e2e8f4" }}>=</span> <span style={{ color: "#febc2e" }}>"Open to opportunities"</span></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 mb-10">
                <MagneticWrap>
                  <button onClick={() => scrollTo("experience")} className="flex items-center gap-3 transition-all duration-300"
                    style={mono(10, "#00f0ff", { padding: "12px 24px", border: "1px solid #00f0ff", letterSpacing: "0.2em", cursor: "none" })}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#00f0ff"; (e.currentTarget as HTMLElement).style.color = "#050814"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#00f0ff"; }}>
                    VIEW EXPERIENCE <ArrowUpRight size={13} />
                  </button>
                </MagneticWrap>
                <MagneticWrap>
                  <button onClick={() => scrollTo("contact")} className="flex items-center gap-3 transition-all duration-300"
                    style={mono(10, "#9d4edd", { padding: "12px 24px", border: "1px solid rgba(157,78,221,0.5)", letterSpacing: "0.2em", cursor: "none" })}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#9d4edd"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#9d4edd"; }}>
                    CONTACT <Mail size={13} />
                  </button>
                </MagneticWrap>
                <CVDownloadButton cvUrl={content.cvDataUrl} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
                {content.stats.map(({ to, suffix, label }) => (
                  <div key={label} className="pl-4" style={{ borderLeft: "2px solid rgba(0,240,255,0.2)" }}>
                    <div style={{ fontFamily: '"Audiowide", cursive', fontSize: "1.6rem", color: "#00f0ff" }}>
                      {suffix.startsWith("2.2") ? suffix : <CountUp to={to} suffix={suffix} />}
                    </div>
                    <div style={mono(9, "#6b8fab", { letterSpacing: "0.16em", marginTop: 4, textTransform: "uppercase" as const })}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Photo + quick facts, merged from About */}
            <div className="lg:col-span-5">
              <div className="flex justify-center lg:justify-end mb-6">
                <div className="group relative inline-block cursor-pointer"
                  style={{ filter: "drop-shadow(0 0 26px rgba(0,240,255,0.16))" }}>
                  <div style={{
                    position: "absolute", inset: -6, borderRadius: "20px",
                    background: "conic-gradient(from 0deg, #00f0ff, #9d4edd, #28c840, #febc2e, #00f0ff)",
                    zIndex: 0, animation: "spin-slow 4s linear infinite",
                    transition: "filter 0.4s ease",
                  }} />
                  <div className="group-hover:opacity-100" style={{
                    position: "absolute", inset: -12, borderRadius: "28px",
                    background: "radial-gradient(circle, rgba(0,240,255,0.26) 0%, rgba(157,78,221,0.16) 45%, transparent 70%)",
                    zIndex: 0, opacity: 0.55, transition: "opacity 0.4s ease", filter: "blur(3px)",
                  }} />
                  <div style={{
                    width: 148, height: 148, borderRadius: 16, overflow: "hidden",
                    border: "2px solid #050814", position: "relative", zIndex: 1,
                    background: "#0b1020", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
                  }} className="group-hover:scale-105">
                    <img
                      src={content.photo || hazemPhoto}
                      alt="Hazem Alabiad"
                      loading="eager"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%", display: "block" }}
                    />
                    {/* RGB-split glitch fringes */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(0,240,255,0.16), transparent 45%, transparent 55%, rgba(157,78,221,0.20))", mixBlendMode: "screen" }} />
                    {/* CRT halftone scanlines */}
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 3px)", mixBlendMode: "multiply" }} />
                    {/* moving scan sweep */}
                    <div style={{ position: "absolute", left: 0, right: 0, height: "55%", top: "-60%", background: "linear-gradient(to bottom, transparent, rgba(0,240,255,0.14) 50%, transparent)", animation: "scan-cv 5.5s linear infinite" }} />
                    {/* targeting reticle */}
                    <div style={{ position: "absolute", left: "50%", top: "50%", width: 44, height: 44, transform: "translate(-50%,-50%)", opacity: 0.5, pointerEvents: "none" }}>
                      <span style={{ position: "absolute", left: 0, top: "50%", width: 8, height: 1, background: "#00f0ff", boxShadow: "0 0 6px #00f0ff" }} />
                      <span style={{ position: "absolute", right: 0, top: "50%", width: 8, height: 1, background: "#00f0ff", boxShadow: "0 0 6px #00f0ff" }} />
                      <span style={{ position: "absolute", top: 6, left: "50%", width: 1, height: 8, background: "#00f0ff", boxShadow: "0 0 6px #00f0ff" }} />
                      <span style={{ position: "absolute", bottom: 6, left: "50%", width: 1, height: 8, background: "#00f0ff", boxShadow: "0 0 6px #00f0ff" }} />
                    </div>
                    {/* corner HUD brackets */}
                    {[{ t: 6, l: 6, w: 16, h: 16, br: "4px 0 0 0", bd: "2px solid rgba(0,240,255,0.85)" },
                      { t: 6, l: "auto", r: 6, w: 16, h: 16, br: "0 6px 0 0", bd: "2px solid rgba(157,78,221,0.85)" },
                      { t: "auto", b: 6, l: 6, w: 16, h: 16, br: "0 0 0 4px", bd: "2px solid rgba(157,78,221,0.85)" },
                      { t: "auto", b: 6, r: 6, w: 16, h: 16, br: "0 0 4px 0", bd: "2px solid rgba(0,240,255,0.85)" }].map((c, i) => (
                      <span key={i} style={{ position: "absolute", top: c.t, bottom: c.b, left: c.l, right: c.r, width: c.w, height: c.h, borderTopLeftRadius: i === 0 ? 4 : 0, borderTopRightRadius: i === 1 ? 4 : 0, borderBottomLeftRadius: i === 2 ? 4 : 0, borderBottomRightRadius: i === 3 ? 4 : 0, borderTop: /top/.test(Object.keys(c).join("")) ? "none" : undefined, ...{} }} />
                  ))}
                  </div>
                  {/* readout strip */}
                  <div style={{
                    position: "absolute", left: 8, right: 8, bottom: 8, zIndex: 2, padding: "3px 7px",
                    background: "rgba(5,8,20,0.72)", borderLeft: "1px solid rgba(0,240,255,0.5)",
                    backdropFilter: "blur(6px)", pointerEvents: "none",
                  }}>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 7.5, letterSpacing: "0.18em", color: "#9ab8d0" }}>
                      ID:<span style={{ color: "#00f0ff" }}>HAZ-2026</span>
                      <span className="blink" style={{ color: "#28c840", margin: "0 4px" }}>█</span>
                      <span style={{ color: "rgba(0,240,255,0.6)" }}>SIG_OK</span>
                    </span>
                  </div>
                  <span style={{
                    position: "absolute", bottom: 34, right: 6, zIndex: 2, width: 14, height: 14,
                    borderRadius: "50%", background: "#28c840", border: "3px solid #050814",
                    boxShadow: "0 0 10px rgba(40,200,64,0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ position: "absolute", inset: -3, borderRadius: "50%", background: "rgba(40,200,64,0.5)", animation: "pulse-dot 2s ease-out infinite" }} />
                  </span>
                </div>
              </div>

              {[
                { Icon: MapPin, label: "Location", value: get("factLocation", DEFAULT_CONTENT.factLocation) },
                { Icon: GraduationCap, label: "Degree", value: get("factDegree", DEFAULT_CONTENT.factDegree) },
                { Icon: Briefcase, label: "Current Role", value: get("factCurrent", DEFAULT_CONTENT.factCurrent) },
                { Icon: Globe, label: "Available For", value: get("factAvailable", DEFAULT_CONTENT.factAvailable) },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex gap-4 items-start p-4 transition-all duration-300"
                  style={{ background: "#080f1c", border: "1px solid rgba(0,240,255,0.07)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.28)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.07)")}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, border: "1px solid rgba(0,240,255,0.2)", color: "#00f0ff" }}>
                    <Icon size={13} />
                  </div>
                  <div>
                    <div style={mono(9, "#6b8fab", { marginBottom: 4, textTransform: "uppercase" as const, letterSpacing: "0.18em" })}>{label}</div>
                    <div style={body(16, "#e2e8f4")}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="float absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ color: "rgba(0,240,255,0.35)" }}>
          <span style={mono(9, "rgba(0,240,255,0.35)", { letterSpacing: "0.3em" })}>SCROLL</span>
          <ChevronDown size={14} />
        </div>
        <div className="absolute top-24 right-8 w-24 h-24 pointer-events-none" style={{ borderTop: "1px solid rgba(0,240,255,0.12)", borderRight: "1px solid rgba(0,240,255,0.12)" }} />
        <div className="absolute bottom-20 left-8 w-24 h-24 pointer-events-none" style={{ borderBottom: "1px solid rgba(157,78,221,0.12)", borderLeft: "1px solid rgba(157,78,221,0.12)" }} />
      </section>


      {/* ── Experience ── */}
      <section id="experience" className="relative py-24 px-6" style={{ zIndex: 10 }}>
        <div ref={expR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="01" label="EXPERIENCE" />
          <div className="transition-all duration-1000" style={{ opacity: expR.visible ? 1 : 0, transform: expR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#e2e8f4" }}>
              Work <span style={{ color: "#9d4edd" }}>History</span>
            </WipeHeading>
            <div className="space-y-4">
              {content.experience.map((exp, idx) => (
                <div key={exp.id || idx} className={`relative p-6 transition-colors duration-300 ${expR.visible ? "depth-rise" : "opacity-0"} ${exp.current ? "glow-border" : ""}`}
                  style={{ background: "#080f1c", border: "1px solid rgba(0,240,255,0.07)", animationDelay: `${idx * 110}ms` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.35)"; (e.currentTarget as HTMLElement).style.background = "#0b1220"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = exp.current ? "" : "rgba(0,240,255,0.07)"; (e.currentTarget as HTMLElement).style.background = "#080f1c"; }}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
                    <div>
                      <h3 style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 17, color: "#e2e8f4", marginBottom: 4 }}>{exp.role}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={mono(10, "#9d4edd", { letterSpacing: "0.12em" })}>{exp.company}</span>
                        {exp.location && <span style={mono(10, "#6b8fab")}>// {exp.location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {exp.current && <span style={mono(9, "#00f0ff", { padding: "2px 8px", border: "1px solid rgba(0,240,255,0.3)", letterSpacing: "0.2em" })}>CURRENT</span>}
                      <span style={mono(9, "#6b8fab")}>{exp.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-1 mb-4">
                    {exp.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span style={{ color: "#00f0ff", marginTop: 7, flexShrink: 0, fontSize: 5 }}>◆</span>
                        <span style={body(15)}>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.tags.map((tag) => (
                      <span key={tag} style={mono(9, "#9d4edd", { padding: "2px 8px", border: "1px solid rgba(157,78,221,0.25)" })}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SkillTicker />

      {/* ── Projects ── */}
      <section id="projects" className="relative py-24 px-6" style={{ zIndex: 10 }}>
        <div ref={projectsR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="02" label="PROJECTS" />
          <div className="transition-all duration-1000" style={{ opacity: projectsR.visible ? 1 : 0, transform: projectsR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#e2e8f4" }}>
              Research <span style={{ color: "#00f0ff" }}>& Projects</span>
            </WipeHeading>
            <Spotlight className="grid grid-cols-1 md:grid-cols-2 gap-5">
{content.projects.map((proj, pidx) => {
                const ProjIcon = [Brain, Code2, Database, GraduationCap, Globe, Briefcase][pidx % 6];
                const projColor = ["#00f0ff", "#9d4edd", "#28c840", "#febc2e"][pidx % 4];
                const sc: Record<string, string> = { RESEARCH: "#9d4edd", COMPLETE: "#28c840", ACTIVE: "#00f0ff", BETA: "#febc2e" };
                return (
                  <TiltCard key={proj.id || proj.name} className={projectsR.visible ? "slide-up-item" : ""} style={{ animationDelay: `${pidx * 120}ms` }}>
                  <div className="relative p-6 overflow-hidden transition-all duration-300 group"
                    style={{ background: "#080f1c", border: "1px solid rgba(0,240,255,0.07)", height: "100%" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.35)"; (e.currentTarget as HTMLElement).style.background = "#0b1220"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,240,255,0.07)"; (e.currentTarget as HTMLElement).style.background = "#080f1c"; }}>
                    {/* shimmer sweep on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" style={{ overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, bottom: 0, width: "50%", background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.04), transparent)", animation: "shimmer-sweep 1.2s ease infinite" }} />
                    </div>
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center justify-center" style={{ width: 40, height: 40, border: `1px solid ${projColor}30`, color: projColor }}>
                        <ProjIcon size={17} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={mono(9, sc[proj.status] || "#febc2e", { padding: "2px 8px", border: `1px solid ${sc[proj.status] || "#febc2e"}30`, letterSpacing: "0.2em" })}>{proj.status}</span>
                        <span style={mono(9, "#6b8fab")}>{proj.year}</span>
                      </div>
                    </div>
                    <h3 className="mb-2 transition-colors duration-200" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 18, color: "#e2e8f4" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#00f0ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#e2e8f4")}>
                      {proj.name}
                    </h3>
                    <p className="mb-5" style={body(15)}>{proj.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {proj.tags.map((tag) => (
                        <span key={tag} style={mono(9, "#6b8fab", { padding: "2px 7px", background: "#0f1624" })}>{tag}</span>
                      ))}
                    </div>
                    <a href={proj.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 transition-opacity hover:opacity-100"
                      style={mono(9, "#00f0ff", { opacity: 0.45, textDecoration: "none", letterSpacing: "0.15em" })}>
                      <Github size={11} /> VIEW ON GITHUB
                    </a>
                    <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderBottom: "1px solid rgba(0,240,255,0.18)", borderRight: "1px solid rgba(0,240,255,0.18)" }} />
                    <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderTop: "1px solid rgba(0,240,255,0.18)", borderLeft: "1px solid rgba(0,240,255,0.18)" }} />
                  </div>
                  </TiltCard>
                );
              })}
            </Spotlight>
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="relative py-24 px-6" style={{ zIndex: 10 }}>
        <div ref={skillsR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="03" label="PROFICIENCIES" />
          <div className="transition-all duration-1000" style={{ opacity: skillsR.visible ? 1 : 0, transform: skillsR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#e2e8f4" }}>
              Technical <span style={{ color: "#9d4edd" }}>Proficiencies</span>
            </WipeHeading>
            <Spotlight className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div>
                <div style={mono(9, "rgba(0,240,255,0.45)", { marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>FULL_STACK_ENGINEERING</div>
                <div className="space-y-2.5">
                  {content.skills.filter((s) => s.cat === "stack").map((s, i) => (
                    <SkillBar key={s.id || s.label} label={s.label} level={s.level} visible={skillsR.visible} delay={i * 90} />
                  ))}
                </div>
              </div>
              <div>
                <div style={mono(9, "rgba(157,78,221,0.45)", { marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>AI_NLP_RESEARCH</div>
                <div className="space-y-2.5">
                  {content.skills.filter((s) => s.cat === "ai").map((s, i) => (
                    <SkillBar key={s.id || s.label} label={s.label} level={s.level} visible={skillsR.visible} delay={i * 90} />
                  ))}
                </div>
              </div>
            </Spotlight>
            <div className="mt-16 pt-8" style={{ borderTop: "1px solid rgba(0,240,255,0.08)" }}>
              <div style={mono(9, "rgba(0,240,255,0.45)", { marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>SPOKEN_LANGUAGES</div>
              <div className="flex flex-wrap gap-3">
                {content.languages.map((lang) => (
                  <div key={lang.id} className="flex items-center gap-2 px-4 py-2" style={{ background: "#080f1c", border: "1px solid rgba(0,240,255,0.1)" }}>
                    <span style={body(16, "#e2e8f4")}>{lang.name}</span>
                    <span style={mono(9, "#6b8fab")}>// {lang.level.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="relative py-24 px-6" style={{ zIndex: 10 }}>
        <div ref={contactR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="04" label="CONTACT" />
          <div className="transition-all duration-1000" style={{ opacity: contactR.visible ? 1 : 0, transform: contactR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <WipeHeading className="mb-6" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2rem,5vw,3.2rem)", color: "#e2e8f4" }}>
                  Get in <span style={{ color: "#00f0ff" }}>Touch</span>
                </WipeHeading>
                <p className="mb-8" style={body(17)}>{get("contactIntro", DEFAULT_CONTENT.contactIntro)}</p>
                <div className="space-y-3">
                  {content.links.map((link) => {
                    const iconKey = (link.label || "").toUpperCase();
                    const Icon = iconKey.includes("GIT") ? Github : iconKey.includes("LINK") ? Linkedin : iconKey.includes("SCHOLAR") ? Globe : Mail;
                    return (
                    <a key={link.id} href={link.href || "#"} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 transition-all duration-300"
                      style={{ background: "#080f1c", border: "1px solid rgba(0,240,255,0.07)", textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.28)")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(0,240,255,0.07)")}>
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, border: "1px solid rgba(0,240,255,0.2)", color: "#00f0ff" }}>
                        <Icon size={13} />
                      </div>
                      <div className="flex-1">
                        <div style={mono(9, "#6b8fab", { marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.2em" })}>{link.label}</div>
                        <div style={body(16, "#e2e8f4")}>{link.value}</div>
                      </div>
                      <ArrowUpRight size={13} color="#00f0ff" style={{ opacity: 0.4 }} />
                    </a>
                    );
                  })}
                </div>
              </div>

              {/* ── Message form ── */}
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-8 px-6" style={{ zIndex: 10, borderTop: "1px solid rgba(0,240,255,0.07)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={mono(9, "#6b8fab", { letterSpacing: "0.22em" })}>{get("footerLine", DEFAULT_CONTENT.footerLine)}</span>
          <div className="flex items-center gap-4">
            {visits !== null && (
              <span style={{ ...mono(9, "#6b8fab", { letterSpacing: "0.18em" }), display: "flex", alignItems: "center", gap: 6 }}>
                <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#00f0ff", display: "inline-block" }} />
                VIEWS:{visits.toLocaleString()}
              </span>
            )}
            <a href="https://github.com/hazem-alabiad" target="_blank" rel="noopener noreferrer" style={{ color: "#6b8fab", opacity: 0.6 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}><Github size={14} /></a>
            <a href="https://linkedin.com/in/hazemalabiad" target="_blank" rel="noopener noreferrer" style={{ color: "#6b8fab", opacity: 0.6 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}><Linkedin size={14} /></a>
          </div>
        </div>
      </footer>

      {/* CMS */}
      <CMSButton
        enabled={cmsEnabled}
        onUnlock={() => { setCmsEnabled(true); setEditorOpen(true); }}
        onDisable={() => setCmsEnabled(false)}
        onOpenEditor={() => setEditorOpen(true)}
        onReset={() => { setContent(loadContent()); resetContent(); }}
      />

      {cmsEnabled && editorOpen && (
        <CmsEditor
          initial={content}
          onSave={(c) => { setContent(c); saveContent(c); }}
          onReset={() => { resetContent(); setContent(loadContent()); }}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
