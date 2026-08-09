import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import hazemPhoto from "@/imports/ADB3B9AC-C855-4126-A54C-3D6BF8705288.jpeg";
// @ts-ignore
import cvPdf from "@/imports/Hazem-Alabiad-CV.pdf";
import CmsEditor from "@/CmsEditor";
import { loadContent, saveContent, resetContent, DEFAULT_CONTENT, type CmsContent, type CmsExperience, type CmsEducation } from "@/cms";
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
  Copy,
  CheckCheck,
  Search,
  CornerDownLeft,
  Command,
  Cpu,
  Sparkles,
  Terminal,
} from "lucide-react";

// ─── Scroll hooks ─────────────────────────────────────────────────────────────



function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
    }, { threshold: 0.35 });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

// ─── System cursor (custom cursor removed: hides native pointer, a11y + perf win) ──

// ─── Scroll progress bar ───────────────────────────────────────────────────────

function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    let raf = 0;
    let last = -1;
    const update = () => {
      raf = 0;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? window.scrollY / h : 0;
      if (p === last) return;
      last = p;
      bar.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 9990, background: "rgba(var(--c1),0.07)", pointerEvents: "none" }} aria-hidden="true">
      <div ref={barRef} style={{ height: "100%", width: "100%", transformOrigin: "left", transform: "scaleX(0)", background: "linear-gradient(90deg, var(--c1h), var(--c2h))", boxShadow: "0 0 8px rgba(var(--c1),0.6)" }} />
    </div>
  );
}

// ─── CRT scanline overlay ─────────────────────────────────────────────────────

function CRTOverlay() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9980, overflow: "hidden" }}>
      {/* moving scanline */}
      <div style={{ position: "absolute", left: 0, right: 0, height: 120, background: "linear-gradient(to bottom, transparent, rgba(var(--c1),0.025) 50%, transparent)", animation: "scanline-sweep 8s linear infinite" }} />
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
    <div ref={ref} className={`relative ${visible ? "wipe-in" : ""} ${className ?? ""}`} style={{ ...style }}>
      {children}
      <span className="wipe-head-rule" style={{ background: "linear-gradient(90deg, var(--c1h), var(--c2h), transparent)" }} />
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
      link: true,
      paused: false,
    };
    function init() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      const w = canvas!.width;
      const count = w < 640 ? 16 : w < 1024 ? 26 : 44;
      state.link = w >= 768;
      state.particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.2 + 0.3,
        t: Math.random(),
        a: Math.random() * 0.25 + 0.12,
      }));
    }
    function tick() {
      if (state.paused) { state.raf = requestAnimationFrame(tick); return; }
      const W = canvas!.width, H = canvas!.height;
      ctx!.fillStyle = "rgba(5,8,20,0.10)";
      ctx!.fillRect(0, 0, W, H);
      state.scanY = (state.scanY + 0.3) % H;
      if (state.scanY < 0.3) {
        ctx!.strokeStyle = "rgba(0,240,255,0.022)";
        ctx!.lineWidth = 0.5;
        const GS = 65;
        for (let x = 0; x < W; x += GS) { ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, H); ctx!.stroke(); }
        for (let y = 0; y < H; y += GS) { ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke(); }
      }
      const sg = ctx!.createLinearGradient(0, state.scanY - 80, 0, state.scanY + 80);
      sg.addColorStop(0, "rgba(0,240,255,0)");
      sg.addColorStop(0.5, "rgba(0,240,255,0.016)");
      sg.addColorStop(1, "rgba(0,240,255,0)");
      ctx!.fillStyle = sg;
      ctx!.fillRect(0, state.scanY - 80, W, 160);
      const { particles, mouse } = state;
      const linkDraw = state.link;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x, dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) { p.vx += (dx / dist) * 0.008; p.vy += (dy / dist) * 0.008; }
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const r = Math.round(p.t * 157), g = Math.round(240 - p.t * 162), b = Math.round(255 - p.t * 34);
        if (linkDraw) {
          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const dd = Math.sqrt((p.x - q.x) ** 2 + (p.y - q.y) ** 2);
            if (dd < 100) {
              ctx!.strokeStyle = `rgba(${r},${g},${b},${(1 - dd / 100) * 0.14})`;
              ctx!.lineWidth = 0.4;
              ctx!.beginPath(); ctx!.moveTo(p.x, p.y); ctx!.lineTo(q.x, q.y); ctx!.stroke();
            }
          }
        }
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},${p.a})`; ctx!.fill();
      }
      state.raf = requestAnimationFrame(tick);
    }
    const onVis = () => { state.paused = document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    init(); tick();
    const onResize = () => init();
    const onMove = (e: MouseEvent | TouchEvent) => {
      const pt = e instanceof TouchEvent && e.touches.length ? e.touches[0] : (e as MouseEvent);
      state.mouse.x = pt.clientX; state.mouse.y = pt.clientY;
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(state.raf);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
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
    "Full-Stack Engineer & AI/NLP Researcher — 6+ years shipping production software used by millions. Pursuing an M.A. in Computational Linguistics at Tübingen, bridging engineering with LLMs and cognitive science.",
  bio1:
    "Software engineer with 6+ years of experience building and leading at scale. Shipped React/TypeScript products used by 2M+ people (GetirJobs) and 1M+ enterprise users (IBM's Data Quality platform). Led engineering teams, raised test coverage to 70–90%, and championed accessibility.",
  bio2:
    "Currently an M.A. student in Computational Linguistics at the University of Tübingen — researching LLMs, NLP, and cognitive science as a Student Assistant at IWM & the Autonomous Learning Lab. Open to NLP/AI/ML and full-stack roles in Tübingen, Stuttgart, or remote.",
};

// ─── Style helpers (module-level so all components can use them) ──────────────

const mono = (sz: number, color = "var(--fg-b)", extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: '"JetBrains Mono", monospace', fontSize: `clamp(${Math.max(9, Math.round(sz * 0.78))}px, ${((sz * 100) / 1280).toFixed(2)}vw, ${sz}px)`, color, ...extra,
});
const raj = (sz: number, color = "var(--fg-a)"): React.CSSProperties => ({
  fontFamily: '"Rajdhani", sans-serif', fontSize: sz, fontWeight: 700, color,
});
const body = (sz: number, color = "var(--fg-b)"): React.CSSProperties => ({
  fontFamily: '"Outfit", sans-serif', fontSize: `clamp(${Math.max(12, Math.round(sz * 0.72))}px, ${((sz * 100) / 1280).toFixed(2)}vw, ${sz}px)`, color, lineHeight: 1.6,
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkillTicker() {
  const [paused, setPaused] = useState(false);
  const items = [
    "React.js", "TypeScript", "GraphQL", "Node.js", "Python",
    "LLMs", "NLP", "TensorFlow", "Docker", "Elasticsearch",
    "Next.js", "Corpus Linguistics", "Fine-tuning", "WebSocket", "Playwright",
    "React.js", "TypeScript", "GraphQL", "Node.js", "Python",
    "LLMs", "NLP", "TensorFlow", "Docker", "Elasticsearch",
    "Next.js", "Corpus Linguistics", "Fine-tuning", "WebSocket", "Playwright",
  ];
  return (
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(var(--c1),0.08)", borderBottom: "1px solid rgba(var(--c1),0.08)", padding: "12px 0", position: "relative", zIndex: 10 }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="ticker-track" style={{ display: "flex", gap: 36, width: "max-content", animation: "ticker 40s linear infinite", animationPlayState: paused ? "paused" : "running" }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.3em", color: i % 3 === 0 ? "var(--c1h)" : "var(--fg-d)", textTransform: "uppercase", whiteSpace: "nowrap", userSelect: "none", display: "flex", alignItems: "center", gap: 12, transition: "color 0.25s", cursor: "default" }}>
            {item} <span style={{ color: "rgba(var(--c1),0.3)" }}>•</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Muse Bloom (ambient joy, no game) ──────────────────────────────────────

let bloomCtx: AudioContext | null = null;
function getBloomCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!bloomCtx) bloomCtx = new AC();
  if (bloomCtx.state === "suspended") bloomCtx.resume();
  return bloomCtx;
}

function playBloomChord() {
  const ctx = getBloomCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const notes = [523.25, 783.99, 1046.5, 1567.98]; // C5 G5 C6 G6
  notes.forEach((fr, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = fr;
    const g = ctx.createGain();
    const t0 = now + i * 0.09;
    g.gain.setValueAtTime(0.0004, t0);
    g.gain.linearRampToValueAtTime(0.07, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0004, t0 + 1.4);
    o.connect(g).connect(ctx.destination);
    o.start(t0); o.stop(t0 + 1.6);
  });
}

const MUSE_WHISPERS = [
  "the corpus dreams in vectors…",
  "attention is all you need — literally",
  "parsing moonlight since 2019",
  "every word, a coordinate",
  "gradients of delight",
  "let me embed that thought",
  "∇L of a good day → 0",
];

function MuseBloom() {
  const [burst, setBurst] = useState<Array<{ id: number; x: number; y: number; c: string; pvx: number; pvy: number }>>([]);
  const [ring, setRing] = useState(false);
  const [whisper, setWhisper] = useState<string | null>(null);
  const seq = useRef(0);
  const whispers = useRef([...MUSE_WHISPERS]);

  const bloom = () => {
    playBloomChord();
    const colors = ["var(--c1h)", "var(--c2h)", "var(--c3h)", "var(--c4h)"];
    const next: typeof burst = [];
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 46 + Math.random() * 86;
      next.push({
        id: ++seq.current,
        x: 50 + Math.cos(a) * r,
        y: 50 + Math.sin(a) * r,
        c: colors[Math.floor(Math.random() * colors.length)],
        pvx: (Math.random() - 0.5) * 60,
        pvy: -(40 + Math.random() * 90),
      });
    }
    setBurst(next);
    setRing(true);
    setTimeout(() => setRing(false), 1200);
    setWhisper(whispers.current[Math.floor(Math.random() * whispers.current.length)]);
    setTimeout(() => setWhisper(null), 3600);
    setTimeout(() => setBurst([]), 1100);
  };

  return (
    <>
      <div style={{ position: "fixed", left: 18, bottom: 18, zIndex: 8500, display: "flex", alignItems: "center" }}>
        {/* whisper readout */}
        <div style={{
          position: "absolute", left: 68, bottom: 14, pointerEvents: "none", whiteSpace: "nowrap",
          opacity: whisper ? 1 : 0, transform: whisper ? "translateX(0)" : "translateX(-6px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.12em",
          color: "rgba(var(--c2),0.8)", fontStyle: "italic",
        }}>
          {whisper && `→ ${whisper}`}
        </div>
        <button onClick={bloom} aria-label="Bloom a spark of joy"
          style={{
            cursor: "pointer", position: "relative", width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(var(--c1),0.22), rgba(var(--c2),0.14))",
            border: "1px solid rgba(var(--c1),0.35)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 24px rgba(var(--c1),0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
            transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s, border-color 0.25s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 14px 30px rgba(var(--c1),0.3)"; e.currentTarget.style.borderColor = "rgba(var(--c1),0.7)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(var(--c1),0.18)"; e.currentTarget.style.borderColor = "rgba(var(--c1),0.35)"; }}>
          {/* expanding halo ring */}
          {ring && <span style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(var(--c2),0.55)", animation: "bloom-ring 1.1s cubic-bezier(0.16,1,0.3,1) forwards" }} />}
          <Sparkles size={19} strokeWidth={2} style={{ color: "var(--c1h)", filter: "drop-shadow(0 0 6px rgba(var(--c1),0.6))" }} />
          {/* particle burst */}
          {burst.map((p) => (
            <span key={p.id} style={{
              position: "absolute", left: "50%", top: "50%", width: 5, height: 5, borderRadius: "50%",
              background: p.c, boxShadow: "0 0 8px rgba(var(--c1),0.7)",
              animation: "bloom-particle 1s cubic-bezier(0.16,1,0.3,1) forwards",
              ['--pvx' as string]: `${p.pvx}px`, ['--pvy' as string]: `${p.pvy}px`,
            }} />
          ))}
        </button>
      </div>
    </>
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
    <div ref={ref} className="relative flex items-center gap-4 mb-4">
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 15, fontWeight: 700, color: "var(--c1h)", letterSpacing: "0.08em", opacity: vis ? 1 : 0, transition: "opacity 0.6s ease" }}>
        {num}
      </span>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: "0.28em", color: "var(--fg-hero)", textTransform: "uppercase", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s" }}>
        {label}
      </span>
      <div className="module-rule" style={{ transform: vis ? "scaleX(1)" : "scaleX(0)", transition: "transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s" }} />
    </div>
  );
}

function SkillBar({ label, level, visible, delay, index }: { label: string; level: number; visible: boolean; delay: number; index: number }) {
  const tier = level >= 90 ? "EXPERT" : level >= 78 ? "ADVANCED" : level >= 65 ? "PROFICIENT" : "COMPETENT";
  return (
    <div className="pb-3" style={{ borderBottom: "1px solid rgba(var(--c1),0.08)" }}>
      <div className="flex justify-between items-center mb-2">
        <span className="flex items-center gap-2.5">
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.1em", color: "var(--c1h)", opacity: 0.7 }}>{String(index).padStart(2, "0")}</span>
          <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: 16, color: "var(--fg-hero)" }}>{label}</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.14em", color: "var(--fg-a)" }}>{level}%</span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: "0.16em", color: level >= 78 ? "var(--c1h)" : "var(--fg-c)", opacity: level >= 78 ? 1 : 0.7 }}>{tier}</span>
        </span>
      </div>
      <div className="skill-track" aria-hidden>
        <i data-lvl={level} className={visible ? "now" : ""} style={{ width: visible ? `${level}%` : 0, transitionDelay: `${delay}ms` }} />
      </div>
    </div>
  );
}

// ─── Focus chips ─────────────────────────────────────────────────────────────

const FOCUS_ITEMS = ["NLP", "LLMs", "ML / Deep Learning", "Comp. Linguistics", "Multilingual AI", "AI Research"];

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

// ─── Impact strip ───────────────────────────────────────────────────────

function ImpactStrip() {
  const { ref, visible } = useReveal(0.15);
  const cells = [
    { to: 6, suffix: "+", label: "YEARS OF ENGINEERING", sub: "Across enterprise & scale-ups" },
    { to: 2, suffix: ".2M+", label: "USERS SERVED", sub: "GetirJobs, product platform" },
    { to: 1, suffix: "M+", label: "ENTERPRISE USERS", sub: "IBM Data Quality platform" },
    { to: 70, suffix: "%+", label: "TEST COVERAGE", sub: "Enforced via Jest / Cypress / Playwright" },
  ];
  return (
    <div ref={ref} className="px-6 py-12" style={{ zIndex: 10, position: "relative", borderTop: "1px solid rgba(var(--c1),0.08)", borderBottom: "1px solid rgba(var(--c1),0.08)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-8"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
          {cells.map((c, i) => (
            <div key={c.label} className={i > 0 ? "xl:border-l xl:border-[rgba(var(--c1),0.09)] xl:pl-8" : ""}>
              <div style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2.6rem,5vw,3.6rem)", color: "var(--c1h)", letterSpacing: "0.01em", lineHeight: 1 }}>
                {c.suffix.startsWith(".") ? (
                  <span><CountUp to={c.to} suffix={c.suffix} /></span>
                ) : (
                  <CountUp to={c.to} suffix={c.suffix} />
                )}
              </div>
              <div className="mt-2" style={mono(10, "var(--fg-a)", { letterSpacing: "0.18em", textTransform: "uppercase" as const })}>{c.label}</div>
              <div className="mt-1" style={mono(9.5, "var(--fg-d)", { letterSpacing: "0.1em" })}>{c.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
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
  const borderCol = phase === "done" ? "var(--c3h)" : phase === "transfer" ? "var(--c1h)" : "rgba(var(--c1),0.35)";

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className="group relative overflow-hidden flex flex-col gap-0 transition-all duration-400"
      style={{
        padding: 0,
        border: `1px solid ${borderCol}`,
        background: isActive ? "rgba(var(--c1),0.05)" : "rgba(var(--c1),0.03)",
        cursor: phase === "idle" ? "none" : "default",
        minWidth: 300,
        boxShadow: phase === "transfer" ? "0 0 24px rgba(var(--c1),0.12)" : phase === "done" ? "0 0 28px rgba(var(--c3),0.2)" : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}
    >
      {/* floating particles */}
      {particles.map((p) => (
        <div key={p.id} style={{
          position: "absolute", left: p.x, top: p.y, width: 3, height: 3,
          borderRadius: "50%", background: p.id % 3 === 0 ? "var(--c2h)" : "var(--c1h)",
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
          style={{ background: "linear-gradient(90deg,transparent,var(--c1h),transparent)", top: "40%", animation: "scan-cv 1.4s linear infinite" }} />
      )}

      {/* top row */}
      <div className="flex items-center gap-4 w-full" style={{ padding: "14px 20px" }}>
        {/* icon box */}
        <div style={{ width: 38, height: 38, border: `1px solid ${borderCol}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: phase === "done" ? "var(--c3h)" : "var(--c1h)", transition: "border-color 0.3s, color 0.3s", position: "relative" }}>
          {phase === "idle"     && <FileDown size={15} />}
          {phase === "init"     && <Loader size={15} style={{ animation: "spin 0.5s linear infinite" }} />}
          {phase === "transfer" && <Loader size={15} style={{ animation: "spin 0.35s linear infinite", color: "var(--c1h)" }} />}
          {phase === "done"     && <CheckCheck size={15} />}
          {/* corner accents */}
          {isActive && <>
            <div style={{ position: "absolute", top: -1, left: -1, width: 6, height: 6, borderTop: "2px solid var(--c1h)", borderLeft: "2px solid var(--c1h)" }} />
            <div style={{ position: "absolute", bottom: -1, right: -1, width: 6, height: 6, borderBottom: "2px solid var(--c1h)", borderRight: "2px solid var(--c1h)" }} />
          </>}
        </div>

        {/* label + sub */}
        <div style={{ textAlign: "left", flex: 1 }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.22em", color: phase === "done" ? "var(--c3h)" : "var(--c1h)", marginBottom: 3, transition: "color 0.3s" }}>
            {scramble}
          </div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: "var(--fg-d)", letterSpacing: "0.12em" }}>
            Hazem-Alabiad-CV.pdf · 86 KB
          </div>
        </div>

        {/* percentage */}
        {isActive && (
          <div style={{ fontFamily: '"Audiowide", cursive', fontSize: 18, color: phase === "done" ? "var(--c3h)" : "var(--c1h)", minWidth: 52, textAlign: "right", transition: "color 0.3s" }}>
            {pct}<span style={{ fontSize: 10 }}>%</span>
          </div>
        )}
      </div>

      {/* progress track */}
      <div style={{ height: 2, background: "rgba(var(--c1),0.08)", width: "100%", position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`,
          background: phase === "done"
            ? "linear-gradient(90deg,var(--c3h),var(--c1h))"
            : "linear-gradient(90deg,var(--c1h),var(--c2h),var(--c1h))",
          backgroundSize: "200% 100%",
          animation: phase === "transfer" ? "shimmer-text 1.2s linear infinite" : "none",
          transition: "width 0.06s linear, background 0.3s",
          boxShadow: phase === "transfer" ? "0 0 8px rgba(var(--c1),0.6)" : "none",
        }} />
        {/* chunked tick marks */}
        {[25, 50, 75].map((x) => (
          <div key={x} style={{ position: "absolute", left: `${x}%`, top: 0, width: 1, height: "100%", background: "rgba(var(--c1),0.15)" }} />
        ))}
      </div>

      {/* terminal log panel */}
      {logLines.length > 0 && (
        <div style={{ width: "100%", padding: "8px 20px 10px", borderTop: "1px solid rgba(var(--c1),0.08)", textAlign: "left" }}>
          {logLines.map((line, i) => (
            <div key={i} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: i === logLines.length - 1 ? "var(--fg-nav)" : "var(--fg-d)", letterSpacing: "0.1em", lineHeight: 1.8, animation: "fade-rise 0.25s ease both" }}>
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
    <div className="p-6 flex flex-col gap-5" style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.12)" }}>
      <div style={mono(9, "rgba(var(--c1),0.5)", { textTransform: "uppercase" as const, letterSpacing: "0.22em" })}>
        TRANSMIT_MESSAGE // hazem.alabiad@icloud.com
      </div>

      {/* Name */}
      <div>
        <div style={mono(9, "var(--fg-c)", { marginBottom: 6, letterSpacing: "0.18em", textTransform: "uppercase" as const })}>YOUR_NAME</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="optional"
          style={{
            width: "100%", background: "var(--bg-page)", border: "1px solid rgba(var(--c1),0.15)",
            padding: "10px 14px", fontFamily: '"JetBrains Mono", monospace', fontSize: 13,
            color: "var(--fg-a)", outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.45)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.15)")}
        />
      </div>

      {/* Message */}
      <div>
        <div style={mono(9, "var(--fg-c)", { marginBottom: 6, letterSpacing: "0.18em", textTransform: "uppercase" as const })}>MESSAGE</div>
        <div style={{ position: "relative" }}>
          <textarea
            value={msg}
            onChange={(e) => { setMsg(e.target.value); setTyping(e.target.value.length > 0); }}
            onKeyDown={handleKey}
            placeholder="Type your message here..."
            rows={5}
            style={{
              width: "100%", background: "var(--bg-page)", border: "1px solid rgba(var(--c1),0.15)",
              padding: "10px 14px", fontFamily: '"JetBrains Mono", monospace', fontSize: 13,
              color: "var(--fg-a)", outline: "none", resize: "vertical" as const, lineHeight: 1.7,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.45)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.15)")}
          />
          {typing && (
            <div style={{ position: "absolute", bottom: 10, right: 12, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: "rgba(var(--c1),0.35)" }}>
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
          padding: "13px 24px", border: `1px solid ${sent ? "var(--c3h)" : "rgba(var(--c1),0.4)"}`,
          background: sent ? "rgba(var(--c3),0.08)" : "rgba(var(--c1),0.04)",
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.22em",
          color: sent ? "var(--c3h)" : "var(--c1h)", cursor: msg.trim() ? "pointer" : "not-allowed",
          opacity: msg.trim() ? 1 : 0.4,
        }}
        onMouseEnter={(e) => { if (msg.trim() && !sent) (e.currentTarget as HTMLElement).style.background = "rgba(var(--c1),0.1)"; }}
        onMouseLeave={(e) => { if (!sent) (e.currentTarget as HTMLElement).style.background = "rgba(var(--c1),0.04)"; }}
      >
        {sent ? <><CheckCheck size={14} /> MESSAGE SENT ✓</> : <><Mail size={14} /> SEND MESSAGE</>}
      </button>

      <div style={mono(9, "var(--fg-d)", { letterSpacing: "0.14em" })}>
        Opens your email client · no data stored
      </div>
    </div>
  );
}

// ─── CMS Button ───────────────────────────────────────────────────────────────

const CMS_TOKEN_KEY = "hazem-portfolio-cms-token";
const CMS_OWNER = "hazem-alabiad";

function CMSButton({ onUnlock, onAutoUnlock, enabled, onDisable, onReset, onOpenEditor }: {
  onUnlock: () => void;
  onAutoUnlock: () => void;
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

  const verify = async (token = pat.trim(), auto = false) => {
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
        setTimeout(() => { auto ? onAutoUnlock() : onUnlock(); close(); }, 1200);
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

  const monoStyle: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: "0.2em" };

  return (
    <>
      {enabled ? (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
          <div style={{ ...monoStyle, color: "var(--c1h)", background: "rgba(var(--bg-rgb),0.9)", border: "1px solid rgba(var(--c1),0.3)", padding: "4px 10px" }}>
            CMS_ACTIVE — CLICK TEXT TO EDIT
          </div>
          <div className="flex gap-2">
            <button onClick={onOpenEditor} title="Open full CV editor"
              style={{ ...monoStyle, color: "var(--c1h)", background: "rgba(var(--bg-rgb),0.9)", border: "1px solid rgba(var(--c1),0.3)", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <PencilLine size={10} /> FULL EDITOR
            </button>
            <button onClick={onReset} title="Reset all CMS edits"
              style={{ ...monoStyle, color: "var(--c2h)", background: "rgba(var(--bg-rgb),0.9)", border: "1px solid rgba(var(--c2),0.3)", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <RotateCcw size={10} /> RESET
            </button>
            <button onClick={onDisable}
              style={{ ...monoStyle, color: "var(--red)", background: "rgba(var(--bg-rgb),0.9)", border: "1px solid rgba(var(--red),0.3)", padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={10} /> LOCK
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} title="CMS — unlock editing"
          style={{ ...monoStyle, position: "fixed", bottom: 24, right: 24, zIndex: 50, color: "var(--c2h)", background: "rgba(var(--bg-rgb),0.85)", border: "1px solid rgba(var(--c2),0.35)", padding: "8px 14px", cursor: "pointer", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: 6, opacity: 0.75 }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
        >
          <PencilLine size={11} /> CMS
        </button>
      )}

      {open && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 100, background: "rgba(var(--bg-rgb),0.82)", backdropFilter: "blur(16px)" }}
          onClick={close}>
          <div className="relative p-8 w-full" style={{ maxWidth: 400, background: "var(--card-photo)", border: "1px solid rgba(var(--c1),0.2)" }}
            onClick={(e) => e.stopPropagation()}>
            <button onClick={close} style={{ position: "absolute", top: 16, right: 16, color: "var(--fg-c)", background: "none", border: "none", cursor: "pointer" }}>
              <X size={14} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <Lock size={14} color="var(--c2h)" />
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.22em", color: "var(--fg-a)" }}>CMS_AUTHENTICATION</span>
            </div>
            <p style={{ fontFamily: '"Outfit", sans-serif', fontSize: 13, color: "var(--fg-b)", lineHeight: 1.7, marginBottom: 24 }}>
              Enter a GitHub Personal Access Token (classic) to verify identity and unlock inline text editing. Changes are saved to localStorage.
            </p>

            {authedAs ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(var(--c1),0.2)", padding: "12px 16px" }}>
                <LockOpen size={13} color="var(--c1h)" />
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.15em", color: "var(--c1h)" }}>
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
                    background: "var(--card)",
                    border: "1px solid rgba(var(--c1),0.15)",
                    color: "var(--fg-a)",
                    padding: "10px 14px",
                    outline: "none",
                    letterSpacing: "0.06em",
                    marginBottom: 12,
                    display: "block",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.4)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.15)")}
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
                    background: loading || !pat.trim() ? "transparent" : "rgba(var(--c1),0.08)",
                    border: "1px solid rgba(var(--c1),0.3)",
                    color: loading || !pat.trim() ? "var(--fg-c)" : "var(--c1h)",
                    cursor: loading || !pat.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "VERIFYING..." : "VERIFY & UNLOCK"}
                </button>
                {error && (
                  <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: "var(--red)", marginTop: 10, letterSpacing: "0.1em" }}>
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
  "[ OK ] All systems nominal. Launching HAZEM_ABIAD_OS…",
];

function BootScreen({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [phase, setPhase] = useState<"boot" | "desktop">("boot");
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      setLines((p) => [...p, BOOT_LINES[i]]);
      i++;
      if (i >= BOOT_LINES.length) {
        clearInterval(iv);
        setTimeout(() => setPhase("desktop"), 500);
      }
    }, 240);
    return () => clearInterval(iv);
  }, []);

  const launched = useRef(false);
  const launch = () => {
    if (launched.current) return;
    launched.current = true;
    setWiping(true);
    setTimeout(() => onDone(), 750);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        launch();
      } else if (e.key === "Escape" && phase === "boot") {
        setPhase("desktop");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const APPS = [
    { Icon: Brain, label: "NLP_TERM", color: "var(--c1h)" },
    { Icon: Code2, label: "DEV_STUDIO", color: "var(--c2h)" },
    { Icon: Database, label: "DATA_GRID", color: "var(--c3h)" },
    { Icon: GraduationCap, label: "RESEARCH", color: "var(--c4h)" },
    { Icon: Globe, label: "BROWSER", color: "var(--c1h)" },
    { Icon: Github, label: "GITHUB", color: "var(--c2h)" },
  ];

  return (
    <div onClick={launch} style={{
      position: "fixed", inset: 0, zIndex: 99999, background: "var(--bg-deep)",
      display: "flex", flexDirection: "column", overflow: "hidden", cursor: "pointer",
      animation: wiping ? "boot-wipe 0.65s cubic-bezier(0.7,0,1,1) forwards" : "none",
      transformOrigin: "top",
    }}>
      {phase === "boot" ? (
        <div className="welcome-boot" style={{ padding: "10vh 8vw" }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: "rgba(var(--c1),0.4)", letterSpacing: "0.3em", marginBottom: 32 }}>
            HAZEM_ALABIAD_OS // BOOT SEQUENCE
          </div>
          <div className="welcome-boot-lines space-y-2">
            {lines.map((line, i) => (
              <div key={i} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: i === lines.length - 1 ? "var(--fg-a)" : "rgba(var(--c1),0.55)", letterSpacing: "0.1em", animation: "boot-row 0.18s ease both" }}>
                {line}
                {i === lines.length - 1 && <span className="blink" style={{ marginLeft: 4, color: "var(--c1h)" }}>▌</span>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, height: 1, background: "rgba(var(--c1),0.12)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(lines.length / BOOT_LINES.length) * 100}%`, background: "linear-gradient(90deg,var(--c1h),var(--c2h))", transition: "width 0.22s ease", boxShadow: "0 0 10px rgba(var(--c1),0.5)" }} />
          </div>
          <div className="welcome-skip" style={{ position: "fixed", bottom: 28, right: 40, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.25em", color: "rgba(var(--c1),0.45)" }}>
            TAP OR ENTER ↵ — SKIP BOOT
          </div>
        </div>
      ) : (
        <div className="welcome-desktop">
          {/* desktop icons */}
          <div className="welcome-icons" style={{ position: "absolute", top: 40, left: 40, display: "flex", flexDirection: "column", gap: 22, zIndex: 2 }}>
            {APPS.map(({ Icon, label, color }, i) => (
              <div key={label} className="welcome-icon" style={{ animationDelay: `${i * 90}ms`, cursor: "pointer", zIndex: 2 }}>
                <div style={{ width: 40, height: 40, border: `1px solid rgba(var(--c1),0.25)`, background: "var(--chip)", color, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}><Icon size={19} /></div>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8, letterSpacing: "0.18em", color: "var(--fg-b)", textAlign: "center", marginTop: 4 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* center hero */}
          <div className="welcome-hero" style={{ zIndex: 3, textAlign: "center" }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.4em", color: "rgba(var(--c1),0.55)", marginBottom: 14 }}>WELCOME TO</div>
            <h1 style={{ fontFamily: '"Audiowide", cursive', fontSize: "clamp(2.2rem,6vw,4.5rem)", color: "var(--fg-a)", letterSpacing: "0.06em", marginBottom: 6, textShadow: "0 0 30px rgba(var(--c1),0.35)" }}>
              HAZEM<span style={{ color: "var(--c1h)" }}>_ALABIAD</span>_OS
            </h1>
            <div style={{ margin: "8px auto 18px", height: 1, width: "min(420px,70vw)", background: "linear-gradient(90deg, transparent, rgba(var(--c1),0.5), transparent)" }} />
            <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: "0.3em", color: "var(--fg-b)" }}>
              VERSION 2.6 <span style={{ color: "var(--c1h)" }}>//</span> BUILT WITH <span style={{ color: "var(--c1h)" }}>AI</span> <Sparkles size={11} style={{ color: "var(--c4h)", verticalAlign: "middle" }} />
            </p>
            <div style={{ fontFamily: '"Outfit", sans-serif', fontSize: 15, color: "var(--fg-b)", marginTop: 18, maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>
              Neural interface online · NLP / LLMs / Computational Linguistics · Full-stack engineering
            </div>
            <div className="blink" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.35em", color: "rgba(var(--c1),0.6)", marginTop: 26, cursor: "pointer" }}>
              [ TAP ANYWHERE / ENTER ↵ ] LAUNCH PORTFOLIO
            </div>
          </div>

          {/* taskbar */}
          <div className="welcome-taskbar" style={{ zIndex: 4 }}>
            <div style={{ borderRadius: 0, padding: "7px 14px", color: "var(--fg-a)", display: "flex", alignItems: "center", fontWeight: 700 }}>
              <Cpu size={14} style={{ color: "var(--c1h)", marginRight: 8 }} /> HAAZ-OS
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: "0.2em", color: "var(--fg-b)", marginRight: 8 }}>
                {new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <button onClick={launch} className="welcome-start" style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "9px 22px", border: "1px solid rgba(var(--c1),0.6)", background: "rgba(var(--c1),0.12)", fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.25em", fontWeight: 700 }}>
                <Terminal size={14} /> START ▸ PORTFOLIO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mouse Trail ──────────────────────────────────────────────────────────────

function MouseTrail() {
  type Dot = { id: number; x: number; y: number; g: string };
  const [dots, setDots] = useState<Dot[]>([]);
  const counter = useRef(0);
  const glyphKey = useRef(() => {
    const g = ["0", "1", "✦", "◈", "θ", "λ", "Δ", "·", "+", "◆"][Math.floor(Math.random() * 10)];
    return g;
  });

  useEffect(() => {
    let last = 0;
    const move = (e: MouseEvent) => {
      const now = Date.now();
      if (now - last < 70) return;
      last = now;
      const id = counter.current++;
      setDots((p) => [...p.slice(-26), { id, x: e.clientX, y: e.clientY, g: glyphKey.current() }]);
      setTimeout(() => setDots((p) => p.filter((d) => d.id !== id)), 850);
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
            width: 5 + age * 4, height: 5 + age * 4,
            borderRadius: "50%",
            background: age > 0.6 ? "rgba(var(--c2),0.5)" : age > 0.3 ? "rgba(var(--c1),0.5)" : "rgba(255,255,255,0.55)",
            boxShadow: age > 0.3 ? "0 0 10px rgba(var(--c1),0.5)" : "0 0 8px rgba(255,255,255,0.4)",
            pointerEvents: "none", zIndex: 9997,
            animation: "trail-fade 0.8s ease forwards",
            mixBlendMode: "screen",
            transform: `scale(${0.35 + age * 0.65})`,
          }}>
            {Math.random() > 0.72 && (
              <span style={{
                position: "absolute", top: -14 - age * 6, left: 0, fontFamily: '"JetBrains Mono", monospace',
                fontSize: 7.5, color: age > 0.6 ? "var(--c2h)" : "var(--c1h)", opacity: 0.7,
                animation: "trail-glyph 0.6s ease forwards",
              }}>{d.g}</span>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─── Side Nav Dots ─────────────────────────────────────────────────────────────

const NAV = ["experience", "projects", "skills", "contact"] as const;
const ALL_SECTIONS = ["home", ...NAV] as const;

function SideNavDots() {
  const active = useActiveSection(ALL_SECTIONS);

  return (
    <div style={{ position: "fixed", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 9000, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
      {ALL_SECTIONS.map((id) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
            title={id.toUpperCase()}
            style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0 }}>
            {isActive && (
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: "var(--c1h)", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7, animation: "fade-rise 0.3s ease" }}>
                {id}
              </span>
            )}
            <div style={{
              height: 2,
              width: isActive ? 24 : 8,
              background: isActive ? "var(--c1h)" : "rgba(var(--c1),0.25)",
              borderRadius: 1,
              transition: "all 0.3s ease",
              boxShadow: isActive ? "0 0 6px rgba(var(--c1),0.6)" : "none",
            }} />
          </button>
        );
      })}
    </div>
  );
}

// ─── Command palette (⌘K) ────────────────────────────────────────────────────

const THEMES = ["dark-cyan", "violet", "matrix", "ember", "light"] as const;

const THEME_LABEL: Record<string, string> = {
  "dark-cyan": "NEON_CYAN",
  violet: "NEON_VIOLET",
  matrix: "MATRIX",
  ember: "EMBER",
  light: "LIGHT",
};

function getStoredTheme(): string {
  try {
    const q = new URLSearchParams(window.location.search).get("theme");
    if (q && THEMES.includes(q as never)) return q;
    const t = localStorage.getItem("hazem_portfolio_theme");
    if (t && THEMES.includes(t as never)) return t;
  } catch {}
  return "dark-cyan";
}

function ThemeSwitcher({ theme, onChange }: { theme: string; onChange: (t: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" style={{ zIndex: 60 }}>
      <button onClick={() => setOpen(!open)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        style={mono(10, "rgba(var(--c1),0.65)", { letterSpacing: "0.16em", border: "1px solid rgba(var(--c1),0.18)", padding: "5px 10px", background: "rgba(var(--c1),0.04)", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 })} >
        <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--c1h)", display: "inline-block", boxShadow: "0 0 8px var(--c1h)" }} />
        {THEME_LABEL[theme] ?? theme.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 mt-2" style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.2)", boxShadow: "0 14px 40px rgba(0,0,0,0.5)", width: 170, padding: 4 }}>
          {THEMES.map((t) => (
            <button key={t} onMouseDown={(e) => { e.preventDefault(); onChange(t); setOpen(false); }}
              className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors"
              style={{ background: theme === t ? "rgba(var(--c1),0.08)" : "transparent", cursor: "pointer", border: "none" }}>
              <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: t === "light" ? "#8a97ad" : `var(--${t === "dark-cyan" ? "c1h" : t === "violet" ? "c2h" : t === "matrix" ? "c3h" : "c4h"})`, display: "inline-block" }} />
              <span style={mono(9.5, theme === t ? "var(--c1h)" : "var(--fg-b)", { letterSpacing: "0.12em" })}>{THEME_LABEL[t]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CommandPalette({ open, onClose, content }: { open: boolean; onClose: () => void; content: CmsContent }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const items = [
    ...NAV.map((id) => ({ type: "section" as const, label: id.toUpperCase(), hint: "JUMP", run: () => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }) })),
    ...content.links.map((l) => ({ type: "link" as const, label: l.label.toUpperCase(), hint: "OPEN", run: () => window.open(l.href || "#", "_blank") })),
    { type: "mail" as const, label: "COPY EMAIL", hint: "CLIPBOARD", run: () => { navigator.clipboard.writeText(content.links.find((l) => l.label.toLowerCase().includes("mail"))?.value || "").catch(() => {}); } },
  ];

  const filtered = q.trim() ? items.filter((it) => it.label.toLowerCase().includes(q.toLowerCase())) : items;
  const cur = sel >= filtered.length ? 0 : sel;

  useEffect(() => {
    if (open) { setQ(""); setSel(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && filtered[cur]) { filtered[cur].run(); onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, q, filtered, cur, onClose]);

  useEffect(() => {
    listRef.current?.querySelectorAll<HTMLElement>("[data-idx]")[cur]?.scrollIntoView({ block: "nearest" });
  }, [cur]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9995, display: "flex", alignItems: "flex-start", justifyContent: "center", background: "rgba(var(--bg-rgb),0.72)", backdropFilter: "blur(6px)", paddingTop: "16vh" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "min(520px, 92vw)", background: "var(--card)", border: "1px solid rgba(var(--c1),0.2)", boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(var(--c1),0.08)" }}>
        <div className="flex gap-2 items-center px-4 pt-3" style={{ borderBottom: "1px solid rgba(var(--c1),0.12)" }}>
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--red-soft)" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--c4h)" }} />
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--c3h)" }} />
          <span style={{ marginLeft: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: "0.22em", color: "var(--fg-c)" }}>QUICK_NAV</span>
          <span className="ml-auto" style={mono(8.5, "rgba(var(--c1),0.5)", { letterSpacing: "0.15em" })}>ESC_QUIT</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3">
          <Search size={12} color="var(--c1h)" style={{ opacity: 0.6 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSel(0); }}
            placeholder="type to filter…"
            style={{ flex: 1, background: "none", border: "none", outline: "none", fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: "var(--fg-a)", letterSpacing: "0.08em" }}
          />
        </div>
        <div ref={listRef} className="px-2 pb-2 space-y-0.5" style={{ maxHeight: "42vh", overflowY: "auto" }}>
          {filtered.length === 0 && (
            <div style={mono(11, "var(--fg-c)", { padding: "14px 10px", textAlign: "center" })}>NO_MATCHES_//404</div>
          )}
          {filtered.map((it, i) => (
            <button key={it.label} data-idx={i} onClick={() => { it.run(); onClose(); }}
              onMouseEnter={() => setSel(i)}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 transition-colors"
              style={{ background: cur === i ? "rgba(var(--c1),0.08)" : "transparent", border: cur === i ? "1px solid rgba(var(--c1),0.25)" : "1px solid transparent", cursor: "pointer" }}>
              <span style={{ width: 8, height: 8, flexShrink: 0, border: `1px solid ${cur === i ? "var(--c1h)" : "var(--c2h)"}` }} />
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.12em", color: cur === i ? "var(--c1h)" : "var(--fg-a)" }}>{it.label}</span>
              <span className="ml-auto flex items-center gap-1.5" style={mono(8.5, cur === i ? "rgba(var(--c1),0.6)" : "var(--fg-d)")}>
                {it.hint} {cur === i && <CornerDownLeft size={10} />}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpEntry({ exp, idx, visible }: { exp: CmsExperience; idx: number; visible: boolean }) {
  const [open, setOpen] = useState(idx === 0);
  return (
    <div className={`tl-row ${visible ? "depth-rise" : "opacity-0"}`}
      style={{ animationDelay: `${idx * 100}ms`, opacity: visible ? 1 : 0 }}>
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-start gap-4 py-4"
        style={{ cursor: "pointer", background: "none", border: "none", padding: "16px 0", fontFamily: "inherit", color: "inherit" }}>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.1em", color: "var(--c1h)", opacity: 0.75, paddingTop: 3, flexShrink: 0 }}>
          {String(idx + 1).padStart(2, "0")}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 19, color: "var(--fg-a)" }}>{exp.role}</h3>
              <span className="transition-opacity" style={mono(10, "var(--c2h)", { letterSpacing: "0.12em" })}>{exp.company}</span>
              {exp.location && <span style={mono(10, "var(--fg-d)")}>// {exp.location}</span>}
            </div>
            <span className="flex items-center gap-2 flex-shrink-0">
              {exp.current && <span style={mono(9, "var(--c1h)", { padding: "2px 8px", border: "1px solid rgba(var(--c1),0.3)", letterSpacing: "0.2em" })}>CURRENT</span>}
              <span style={mono(10, "var(--fg-c)", { letterSpacing: "0.12em" })}>{exp.period}</span>
              <span style={{ color: "var(--c1h)", fontSize: 10, transition: "transform 0.3s ease", transform: open ? "rotate(90deg)" : "rotate(0deg)", flexShrink: 0 }}>▶</span>
            </span>
          </div>
        </div>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.35s cubic-bezier(0.16,1,0.3,1)", maxWidth: 820 }}>
        <div style={{ overflow: "hidden" }}>
          <ul className="space-y-1.5 pb-3 pl-8">
            {exp.bullets.map((b, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span style={{ color: "var(--c1h)", marginTop: 8, flexShrink: 0, fontSize: 6 }}>▎</span>
                <span style={body(15, "var(--fg-b)")}>{b}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1.5 pl-8 pb-4">
            {exp.tags.map((tag) => (
              <span key={tag} style={mono(9, "var(--fg-c)", { padding: "3px 9px", border: "1px solid rgba(var(--c1),0.14)", letterSpacing: "0.08em" })}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Education entry ─────────────────────────────────────────────────────────────

function EduEntry({ edu, idx, visible }: { edu: CmsEducation; idx: number; visible: boolean }) {
  return (
    <div className={`tl-row ${visible ? "depth-rise" : "opacity-0"}`}
      style={{ animationDelay: `${idx * 100}ms`, opacity: visible ? 1 : 0, borderBottom: "1px solid rgba(var(--c1),0.08)", padding: "16px 0" }}>
      <p className="flex items-center gap-2 mb-2">
        <span style={{ color: "var(--c2h)", flexShrink: 0 }}><GraduationCap size={16} /></span>
        <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 19, color: "var(--fg-a)" }}>{edu.degree}</span>
        {edu.current && <span style={mono(9, "var(--c1h)", { padding: "2px 8px", border: "1px solid rgba(var(--c1),0.3)", letterSpacing: "0.2em" })}>CURRENT</span>}
        <span style={mono(10, "var(--fg-c)", { marginLeft: "auto", flexShrink: 0, letterSpacing: "0.12em" })}>{edu.period}</span>
      </p>
      <p className="mb-2" style={mono(10, "var(--c2h)", { letterSpacing: "0.12em" })}>
        {edu.school}
        {edu.location && <span style={{ color: "var(--fg-c)" }}> // {edu.location}</span>}
      </p>
      <p className="mb-3" style={body(15, "var(--fg-b)", { maxWidth: 720 })}>{edu.detail}</p>
      <div className="flex flex-wrap gap-1.5">
        {edu.badges.map((b) => (
          <span key={b} style={mono(9, "var(--fg-c)", { padding: "3px 9px", border: "1px solid rgba(var(--c1),0.14)", letterSpacing: "0.08em" })}>{b}</span>
        ))}
      </div>
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
          background: `radial-gradient(300px circle at ${pos.x}% ${pos.y}%, rgba(var(--c1),0.07), transparent 60%)`,
          transition: "opacity 0.2s",
        }} />
      )}
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

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
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => getStoredTheme());
  const heroNameRef = useRef<HTMLHeadingElement>(null);
  const heroTagRef = useRef<HTMLParagraphElement>(null);

  // parallax without React re-renders — passive scroll listener, only updates while hero visible
  useEffect(() => {
    const name = heroNameRef.current;
    const tag = heroTagRef.current;
    if (!name || !tag) return;
    const upd = () => {
      const y = window.scrollY;
      const inHero = y < window.innerHeight;
      name.style.transform = inHero ? `translateY(${(y * 0.18).toFixed(2)}px)` : "";
      tag.style.transform = inHero ? `translateY(${(y * 0.09).toFixed(2)}px)` : "";
    };
    let raf = 0;
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; upd(); }); };
    window.addEventListener("scroll", onScroll, { passive: true });
    upd();
    return () => { window.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useLayoutEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      try { localStorage.setItem("hazem_portfolio_theme", theme); } catch {}
    }
  }, [theme]);

  const activeSection = useActiveSection(NAV);

  useEffect(() => {
    let alive = true;
    countVisits().then((v) => { if (alive && typeof v === "number") setVisits(v); });
    return () => { alive = false; };
  }, []);

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
          style: { ...base, outline: "1px dashed rgba(var(--c1),0.4)", cursor: "text" as const },
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

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((o) => !o); }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-page)", color: "var(--fg-a)" }}>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}
      {/* Ambient background (static, no scroll re-renders) */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(70% 60% at 78% 22%, rgba(var(--c2),0.05), transparent 60%)" }} aria-hidden="true" />
      <ScrollProgressBar />
      <SideNavDots />
      {/* deco layers removed: CustomCursor, MouseTrail, CRTOverlay, ParticleField — rAF + canvas cost, no functional value */}
      <MuseBloom />

      {/* ── Nav ── */}
      <nav className="fixed top-0 w-full z-50 transition-all duration-500"
        style={{ background: scrolled ? "rgba(var(--bg-rgb),0.88)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(var(--c1),0.1)" : "none" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => scrollTo("home")} style={mono(13, "var(--c1h)", { letterSpacing: "0.2em" })} className="hover:opacity-75 transition-opacity">HAZ:ALABIAD</button>
          <div className="hidden md:flex items-center gap-8">
            {NAV.map((id) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="uppercase transition-opacity"
                style={mono(12, activeSection === id ? "var(--c1h)" : "var(--fg-nav)", { letterSpacing: "0.2em", borderBottom: activeSection === id ? "1px solid rgba(var(--c1),0.5)" : "1px solid transparent", paddingBottom: 2, boxShadow: activeSection === id ? "0 2px 12px rgba(var(--c1),0.15)" : "none" })}>{id}</button>
            ))}
          </div>
<div className="hidden md:flex items-center gap-3">
            <ThemeSwitcher theme={theme} onChange={setTheme} />
            <button onClick={() => setPaletteOpen(true)} style={mono(10, "rgba(var(--c1),0.55)", { letterSpacing: "0.18em", border: "1px solid rgba(var(--c1),0.18)", padding: "5px 10px", background: "rgba(var(--c1),0.04)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 })}
              className="hover:opacity-100 transition-opacity" aria-label="Command palette">
              <Command size={12} style={{ color: "var(--c1h)" }} /> <span style={{ color: "var(--fg-a)" }}>K</span>
            </button>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] pulse-dot" />
            <span style={mono(9, "rgba(var(--c1),0.5)", { letterSpacing: "0.3em" })}>ONLINE_2026</span>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={mono(11, "var(--c1h)")}>{menuOpen ? "CLOSE" : "MENU"}</button>
        </div>
        {menuOpen && (
          <div className="md:hidden px-6 py-4 space-y-4" style={{ background: "rgba(var(--bg-rgb),0.96)", borderTop: "1px solid rgba(var(--c1),0.1)" }}>
            {NAV.map((id) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left uppercase" style={mono(10, activeSection === id ? "var(--c1h)" : "var(--fg-b)", { letterSpacing: "0.22em" })}>{id}</button>
            ))}
            <div className="pt-1 space-y-2" style={{ borderTop: "1px solid rgba(var(--c1),0.1)" }}>
              <span style={mono(9, "rgba(var(--c1),0.45)", { letterSpacing: "0.25em" })}>THEME</span>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => (
                  <button key={t} onClick={() => { setTheme(t); setMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-left transition-colors"
                    style={{ background: theme === t ? "rgba(var(--c1),0.1)" : "rgba(var(--c1),0.04)", border: `1px solid ${theme === t ? "rgba(var(--c1),0.4)" : "rgba(var(--c1),0.14)"}`, cursor: "pointer" }}>
                    <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: t === "light" ? "#8a97ad" : `var(--${t === "dark-cyan" ? "c1h" : t === "violet" ? "c2h" : t === "matrix" ? "c3h" : "c4h"})`, display: "inline-block" }} />
                    <span style={mono(9, theme === t ? "var(--c1h)" : "var(--fg-b)", { letterSpacing: "0.1em" })}>{THEME_LABEL[t]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section id="home" className="relative min-h-screen flex flex-col justify-center px-6 pt-24 lg:pt-20" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16">
            {/* Left — identity, role, bio, CTAs, stats */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                <span style={mono(9.5, "rgba(var(--c1),0.5)", { letterSpacing: "0.3em" })}>NEURAL_ID::HAZ-2026</span>
                <div className="w-12 h-px" style={{ background: "rgba(var(--c1),0.18)" }} />
                <span style={mono(9.5, "var(--fg-d)", { letterSpacing: "0.28em" })}>2026.08</span>
              </div>

              <h1 ref={heroNameRef} className="relative leading-[1.02] tracking-tight mb-6 select-none"
                style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(3.2rem,9vw,6.8rem)", letterSpacing: "0.01em" }}>
                <span style={{ color: "var(--fg-a)" }}>Hazem</span>{" "}
                <span style={{ color: "var(--c1h)" }}>Alabiad</span>
              </h1>

              <div className="flex items-center gap-2.5 mb-6">
                <span className="blink w-2 h-4" style={{ background: "var(--c1h)" }} />
                <p style={{ ...mono(14, "var(--fg-hero)", { letterSpacing: "0.14em" }), fontSize: "clamp(14px,1.9vw,19px)" }}>{typeText}</p>
              </div>

              <p ref={heroTagRef} {...ep("heroTagline", DEFAULTS.heroTagline, { ...body(19, "var(--fg-hero)"), maxWidth: 640, marginBottom: 18 })}>
                {get("heroTagline", DEFAULTS.heroTagline)}
              </p>

              <p {...ep("bio1", DEFAULTS.bio1, { ...body(16, "var(--fg-b)"), maxWidth: 640, marginBottom: 12 })}>
                {get("bio1", DEFAULTS.bio1)}
              </p>
              <p {...ep("bio2", DEFAULTS.bio2, { ...body(16, "var(--fg-b)"), maxWidth: 640, marginBottom: 28 })}>
                {get("bio2", DEFAULTS.bio2)}
              </p>

              <div className="flex flex-wrap items-center gap-3 mb-8" style={{ maxWidth: 600 }}>
                <span style={mono(9, "rgba(var(--c1),0.5)", { letterSpacing: "0.25em", textTransform: "uppercase" })}>FOCUS://</span>
                {FOCUS_ITEMS.map((t, i) => (
                  <span key={t} className="badge-in"
                    style={{
                      fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                      letterSpacing: "0.16em", textTransform: "uppercase", padding: "5px 11px",
                      color: "var(--fg-c)", background: "var(--chip)",
                      animationDelay: `${i * 80}ms`, transition: "color 0.2s, background 0.2s, border-color 0.2s",
                      border: "1px solid rgba(var(--c1),0.1)", cursor: "default",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--c1h)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.4)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--fg-c)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.1)"; }}>
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3.5 mb-10">
                <MagneticWrap>
                  <button onClick={() => scrollTo("experience")} className="flex items-center gap-2.5 transition-all duration-300"
                    style={mono(10, "var(--c1h)", { padding: "13px 26px", border: "1px solid rgba(var(--c1),0.55)", letterSpacing: "0.2em", cursor: "pointer" })}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(var(--c1),0.1)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--c1h)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.55)"; }}>
                    VIEW EXPERIENCE <ArrowUpRight size={13} />
                  </button>
                </MagneticWrap>
                <MagneticWrap>
                  <button onClick={() => scrollTo("contact")} className="flex items-center gap-2.5 transition-all duration-300"
                    style={mono(10, "var(--fg-hero)", { padding: "13px 26px", border: "1px solid rgba(var(--c1),0.22)", letterSpacing: "0.2em", cursor: "pointer" })}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.6)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.22)"; }}>
                    CONTACT ME
                  </button>
                </MagneticWrap>
                <CVDownloadButton cvUrl={content.cvDataUrl} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-5 max-w-2xl">
                {content.stats.map(({ to, suffix, label }) => (
                  <div key={label} className="pl-4" style={{ borderLeft: "1px solid rgba(var(--c1),0.22)" }}>
                    <div style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(1.7rem,3vw,2.2rem)", color: "var(--c1h)", lineHeight: 1 }}>
                      {suffix.startsWith("2.2") ? suffix : <CountUp to={to} suffix={suffix} />}
                    </div>
                    <div style={mono(9, "var(--fg-c)", { letterSpacing: "0.16em", marginTop: 6, textTransform: "uppercase" as const })}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Photo + quick facts, merged from About */}
            <div className="lg:col-span-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { Icon: MapPin, label: "Location", value: get("factLocation", DEFAULT_CONTENT.factLocation) },
                  { Icon: GraduationCap, label: "Degree", value: get("factDegree", DEFAULT_CONTENT.factDegree) },
                  { Icon: Briefcase, label: "Current", value: get("factCurrent", DEFAULT_CONTENT.factCurrent) },
                  { Icon: Globe, label: "Open To", value: get("factAvailable", DEFAULT_CONTENT.factAvailable) },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="flex gap-3 p-4 items-start"
                    style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.08)" }}>
                    <Icon size={15} color="var(--c1h)" style={{ opacity: 0.8, marginTop: 1, flexShrink: 0 }} />
                    <div>
                      <div style={mono(8.5, "var(--fg-c)", { textTransform: "uppercase" as const, letterSpacing: "0.16em", marginBottom: 2 })}>{label}</div>
                      <div style={body(14, "var(--fg-a)")}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="group relative cursor-pointer" style={{ filter: "drop-shadow(0 12px 40px rgba(var(--c1),0.14))" }}>
                <div style={{
                  width: "100%", aspectRatio: "16/10", overflow: "hidden", position: "relative",
                  border: "1px solid rgba(var(--c1),0.18)", background: "var(--card-photo)",
                }}>
                  <img
                    src={content.photo || hazemPhoto}
                    alt="Hazem Alabiad"
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 38%", display: "block" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--bg-rgb),0.06) 0%, transparent 45%, rgba(var(--bg-rgb),0.72) 100%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.16) 3px, rgba(0,0,0,0.16) 4px)", opacity: 0.5, pointerEvents: "none" }} />
                  <div className="flex items-center gap-2" style={{ position: "absolute", left: 14, bottom: 12, zIndex: 2 }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: "var(--c3h)", boxShadow: "0 0 8px var(--c3h)", display: "inline-block" }} />
                    <span style={mono(9, "var(--fg-a)", { letterSpacing: "0.16em" })}>HAZEM ALABIAD · ONLINE</span>
                  </div>
                </div>
              </div>

              {/* ── Job mode / availability readout ── */}
              <div className="p-5" style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.12)" }}>
                <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: "1px solid rgba(var(--c1),0.08)" }}>
                  <span style={{ color: "var(--fg-c)", fontSize: 9.5, letterSpacing: "0.18em" }}>hazem@tübingen</span>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9.5, color: "var(--c3h)", letterSpacing: "0.15em" }}>./job-mode --status</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { t: "NLP Engineer", p: true },
                    { t: "LLM / AI Engineer", p: false },
                    { t: "Research Engineer · AI/CompLing", p: false },
                    { t: "Full-Stack Engineer", p: false },
                  ].map((r, i) => (
                    <div key={r.t} className="flex items-center gap-2.5">
                      <span style={mono(9.5, "var(--fg-d)", { letterSpacing: "0.1em" })}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={mono(11.5, "var(--fg-hero)", { lineHeight: 1.6 })}>{r.t}</span>
                      {r.p && <span style={mono(9, "var(--c3h)", { letterSpacing: "0.14em", marginLeft: "auto" })}>← PRIORITY</span>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 grid grid-cols-2 gap-x-4 gap-y-1.5" style={{ borderTop: "1px solid rgba(var(--c1),0.08)" }}>
                  <div style={mono(9.5, "var(--fg-b)", { letterSpacing: "0.1em" })}><span style={{ color: "var(--c2h)" }}>availability</span><span style={{ color: "var(--fg-a)" }}> = </span><span style={{ color: "var(--c3h)" }}>"Immediately"</span></div>
                  <div style={mono(9.5, "var(--fg-b)", { letterSpacing: "0.1em" })}><span style={{ color: "var(--c2h)" }}>location</span><span style={{ color: "var(--fg-a)" }}> = </span><span style={{ color: "var(--c3h)" }}>"{get("factLocation", DEFAULT_CONTENT.factLocation)}"</span></div>
                  <div style={mono(9.5, "var(--fg-b)", { letterSpacing: "0.1em" })}><span style={{ color: "var(--c2h)" }}>open_to</span><span style={{ color: "var(--fg-a)" }}> = </span><span style={{ color: "var(--c1h)" }}>["Full-time","Remote"]</span></div>
                  <div style={mono(9.5, "var(--fg-b)", { letterSpacing: "0.1em" })}><span style={{ color: "var(--c2h)" }}>status</span><span style={{ color: "var(--fg-a)" }}> = </span><span style={{ color: "var(--c4h)" }}>"Open to opportunities"</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5" style={{ color: "rgba(var(--c1),0.35)" }}>
          <span style={mono(9, "rgba(var(--c1),0.35)", { letterSpacing: "0.3em" })}>SCROLL</span>
          <ChevronDown size={14} />
        </div>
      </section>

      <ImpactStrip />

      {/* ── Experience ── */}
      <section id="experience" className="relative py-16 lg:py-20 px-6" style={{ zIndex: 10 }}>
        <div ref={expR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="01" label="EXPERIENCE" />
          <div className="transition-all duration-1000" style={{ opacity: expR.visible ? 1 : 0, transform: expR.visible ? "translateY(0)" : "translateY(32px)" }}>
            {/* ── Education ── */}
            <div className="mb-8">
              <div style={mono(9, "rgba(var(--c2),0.45)", { marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>EDUCATION</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.education.map((edu, idx) => (
                  <EduEntry key={edu.id || idx} edu={edu} idx={idx} visible={expR.visible} />
                ))}
              </div>
            </div>

            <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2.1rem,5vw,3.4rem)", color: "var(--fg-a)" }}>
              Work <span style={{ color: "var(--c2h)" }}>History</span>
            </WipeHeading>
            <div className="space-y-3">
              {content.experience.map((exp, idx) => (
                <ExpEntry key={exp.id || idx} exp={exp} idx={idx} visible={expR.visible} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <SkillTicker />

      {/* ── Projects ── */}
      <section id="projects" className="relative py-16 lg:py-20 px-6" style={{ zIndex: 10 }}>
        <div ref={projectsR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="02" label="PROJECTS" />
          <div className="transition-all duration-1000" style={{ opacity: projectsR.visible ? 1 : 0, transform: projectsR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2.1rem,5vw,3.4rem)", color: "var(--fg-a)" }}>
              Research <span style={{ color: "var(--c1h)" }}>& Projects</span>
            </WipeHeading>
            <Spotlight className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
{content.projects.map((proj, pidx) => {
                const ProjIcon = [Brain, Code2, Database, GraduationCap, Globe, Briefcase][pidx % 6];
                const projColor = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)"][pidx % 4];
                const projHex = ["var(--c1h)", "var(--c2h)", "var(--c3h)", "var(--c4h)"][pidx % 4];
                const sc: Record<string, string> = { RESEARCH: "var(--c2h)", COMPLETE: "var(--c3h)", ACTIVE: "var(--c1h)", BETA: "var(--c4h)" };
                return (
                  <div key={proj.id || proj.name} className={`transition-all duration-300 ${projectsR.visible ? "slide-up-item" : "opacity-0"}`} style={{ animationDelay: `${pidx * 120}ms` }}>
                  <div className="flex flex-col h-full p-5 transition-colors duration-300"
                    style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.08)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.4)"; (e.currentTarget as HTMLElement).style.background = "var(--card-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.08)"; (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.1em", color: "var(--fg-d)" }}>{String(pidx + 1).padStart(2, "0")}</span>
                      <div className="flex items-center gap-2">
                        <span style={mono(9, sc[proj.status] || "var(--c4h)", { padding: "2px 8px", border: "1px solid rgba(var(--c1),0.14)", letterSpacing: "0.18em" })}>{proj.status}</span>
                        <span style={mono(9, "var(--fg-c)")}>{proj.year}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 mb-3">
                      <span style={{ color: projHex }}><ProjIcon size={15} strokeWidth={1.6} /></span>
                      <h3 style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: 17.5, color: "var(--fg-a)", letterSpacing: "0.02em" }}>{proj.name}</h3>
                    </div>
                    <p className="mb-4 flex-1" style={body(14, "var(--fg-b)", { lineHeight: 1.6 })}>{proj.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {proj.tags.slice(0, 5).map((tag) => (
                        <span key={tag} style={mono(9, "var(--fg-c)", { padding: "2px 7px", background: "var(--chip)" })}>{tag}</span>
                      ))}
                    </div>
                    <a href={proj.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 transition-opacity"
                      style={mono(9, "var(--c1h)", { textDecoration: "none", letterSpacing: "0.14em", opacity: 0.7 })}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}>
                      <Github size={11} /> VIEW ON GITHUB
                    </a>
                  </div>
                  </div>
                );
              })}
            </Spotlight>
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="relative py-16 lg:py-20 px-6" style={{ zIndex: 10 }}>
        <div ref={skillsR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="03" label="PROFICIENCIES" />
          <div className="transition-all duration-1000" style={{ opacity: skillsR.visible ? 1 : 0, transform: skillsR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2.1rem,5vw,3.4rem)", color: "var(--fg-a)" }}>
              Technical <span style={{ color: "var(--c2h)" }}>Proficiencies</span>
            </WipeHeading>
            <Spotlight className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <div style={mono(9, "rgba(var(--c1),0.45)", { marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>FULL_STACK_ENGINEERING</div>
                <div className="space-y-2.5">
                  {content.skills.filter((s) => s.cat === "stack").map((s, i) => (
                    <SkillBar key={s.id || s.label} label={s.label} level={s.level} visible={skillsR.visible} delay={i * 90} index={i + 1} />
                  ))}
                </div>
              </div>
              <div>
                <div style={mono(9, "rgba(var(--c2),0.45)", { marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>AI_NLP_RESEARCH</div>
                <div className="space-y-2.5">
                  {content.skills.filter((s) => s.cat === "ai").map((s, i) => (
                    <SkillBar key={s.id || s.label} label={s.label} level={s.level} visible={skillsR.visible} delay={i * 90} index={i + 7} />
                  ))}
                </div>
              </div>
            </Spotlight>
            <div className="mt-8">
              <div style={mono(9, "rgba(var(--c1),0.5)", { marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.26em" })}>SPOKEN_LANGUAGES</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-6">
                {content.languages.map((lang, i) => {
                  const L = lang.level.toLowerCase();
                  const pct = L.includes("native") ? 100 : L.includes("profic") ? 75 : L.includes("fluent") ? 85 : L.includes("beginner") ? 40 : 60;
                  return (
                    <div key={lang.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 18, color: "var(--fg-a)" }}>{lang.name}</span>
                        <span style={mono(9, pct >= 75 ? "var(--c1h)" : "var(--fg-c)", { letterSpacing: "0.14em" })}>{lang.level.toUpperCase()}</span>
                      </div>
                      <div className="skill-track" aria-hidden>
                        <i style={{ width: skillsR.visible ? `${pct}%` : 0, transition: `width 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 90}ms` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-8">
              <div style={mono(9, "rgba(var(--c1),0.5)", { marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.26em" })}>TOOLCHAIN & WORKFLOW</div>
              <div className="flex flex-wrap gap-2">
                {["Docker", "Linux", "Git", "CI/CD", "Figma", "REST API", "WebSocket", "GraphQL", "Jest", "Cypress", "Playwright", "Vite", "Next.js", "Elasticsearch", "MySQL", "Redux", "Agile / Scrum", "Code Review", "E2E Testing"].map((t, ti) => (
                  <span key={t}
                    style={{ ...mono(9.5, "var(--fg-b)", { padding: "8px 15px", border: "1px solid rgba(var(--c1),0.12)", letterSpacing: "0.12em", background: "var(--card)" }), opacity: skillsR.visible ? 1 : 0, transform: skillsR.visible ? "translateY(0)" : "translateY(8px)", transition: `opacity 0.5s ease ${ti * 40}ms, transform 0.5s ease ${ti * 40}ms, border-color 0.25s ease, color 0.25s ease`, cursor: "default" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.45)"; (e.currentTarget as HTMLElement).style.color = "var(--c1h)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.12)"; (e.currentTarget as HTMLElement).style.color = "var(--fg-b)"; }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="relative py-16 lg:py-20 px-6" style={{ zIndex: 10 }}>
        <div ref={contactR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="04" label="CONTACT" />
          <div className="transition-all duration-1000" style={{ opacity: contactR.visible ? 1 : 0, transform: contactR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2.1rem,5vw,3.4rem)", color: "var(--fg-a)" }}>
                  Get in <span style={{ color: "var(--c1h)" }}>Touch</span>
                </WipeHeading>
                <p className="mb-5" style={body(16)}>{get("contactIntro", DEFAULT_CONTENT.contactIntro)}</p>
                <div className="space-y-2.5">
                  {content.links.map((link) => {
                    const iconKey = (link.label || "").toUpperCase();
                    const isMail = iconKey.includes("EMAIL") || iconKey.includes("MAIL");
                    const Icon = iconKey.includes("GIT") ? Github : iconKey.includes("LINK") ? Linkedin : iconKey.includes("SCHOLAR") ? Globe : Mail;
                    const inner = (
                      <>
                        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, border: "1px solid rgba(var(--c1),0.2)", color: "var(--c1h)" }}>
                          <Icon size={13} />
                        </div>
                        <div className="flex-1">
                          <div style={mono(9, "var(--fg-c)", { marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.2em" })}>{link.label}</div>
                          <div style={body(16, "var(--fg-a)")}>{link.value}</div>
                        </div>
                        <span className="flex items-center gap-1.5 flex-shrink-0">
                          {isMail ? <Copy size={13} color="var(--c1h)" style={{ opacity: 0.6 }} /> : <ArrowUpRight size={13} color="var(--c1h)" style={{ opacity: 0.4 }} />}
                          {isMail && copiedEmail && (
                            <span style={mono(9, "var(--c3h)", { letterSpacing: "0.15em" })}>COPIED</span>
                          )}
                        </span>
                      </>
                    );
                    const base = "flex items-center gap-3.5 p-3.5 transition-all duration-300";
                    const box = { background: "var(--card)", border: "1px solid rgba(var(--c1),0.07)" };
                    if (isMail) {
                      return (
                        <button key={link.id} onClick={() => { navigator.clipboard.writeText(link.value).catch(() => {}); setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }}
                          className={`${base} w-full text-left`} style={{ ...box, borderColor: copiedEmail ? "rgba(var(--c3),0.4)" : "rgba(var(--c1),0.07)", cursor: "pointer" }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = copiedEmail ? "rgba(var(--c3),0.5)" : "rgba(var(--c1),0.28)")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = copiedEmail ? "rgba(var(--c3),0.4)" : "rgba(var(--c1),0.07)")}>
                          {inner}
                        </button>
                      );
                    }
                    return (
                      <a key={link.id} href={link.href || "#"} target="_blank" rel="noopener noreferrer"
                        className={base}
                        style={{ ...box, textDecoration: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.28)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.07)")}>
                        {inner}
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
      <footer className="relative py-8 px-6" style={{ zIndex: 10, borderTop: "1px solid rgba(var(--c1),0.07)" }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={mono(9, "var(--fg-c)", { letterSpacing: "0.22em" })}>{get("footerLine", DEFAULT_CONTENT.footerLine)}</span>
          <div className="flex items-center gap-4">
            {visits !== null && (
              <span style={{ ...mono(9, "var(--fg-c)", { letterSpacing: "0.18em" }), display: "flex", alignItems: "center", gap: 6 }}>
                <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--c1h)", display: "inline-block" }} />
                VIEWS:{visits.toLocaleString()}
              </span>
            )}
            <a href="https://github.com/hazem-alabiad" target="_blank" rel="noopener noreferrer" style={{ color: "var(--fg-c)", opacity: 0.6 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}><Github size={14} /></a>
            <a href="https://linkedin.com/in/hazemalabiad" target="_blank" rel="noopener noreferrer" style={{ color: "var(--fg-c)", opacity: 0.6 }} onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}><Linkedin size={14} /></a>
          </div>
        </div>
      </footer>

      {/* CMS */}
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} content={content} />
      <CMSButton
        enabled={cmsEnabled}
        onUnlock={() => { setCmsEnabled(true); setEditorOpen(true); }}
        onAutoUnlock={() => setCmsEnabled(true)}
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
