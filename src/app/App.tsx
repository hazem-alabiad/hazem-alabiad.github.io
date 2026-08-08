import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import hazemPhoto from "@/imports/ADB3B9AC-C855-4126-A54C-3D6BF8705288.jpeg";
// @ts-ignore
import cvPdf from "@/imports/Hazem-Alabiad-CV.pdf";
import CmsEditor from "@/CmsEditor";
import { loadContent, saveContent, resetContent, DEFAULT_CONTENT, type CmsContent, type CmsExperience } from "@/cms";
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
  Atom,
} from "lucide-react";

// ─── Scroll hooks ─────────────────────────────────────────────────────────────

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
        ringRef.current.style.borderColor = hovered ? "rgba(var(--c2),0.8)" : "rgba(var(--c1),0.5)";
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", move); cancelAnimationFrame(raf.current); };
  }, [hovered]);

  return (
    <>
      <div ref={dotRef} style={{ position: "fixed", top: 0, left: 0, width: 6, height: 6, borderRadius: "50%", background: "var(--c1h)", pointerEvents: "none", zIndex: 100000, mixBlendMode: "screen", transition: "transform 0.05s linear" }} />
      <div ref={ringRef} style={{ position: "fixed", top: 0, left: 0, width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(var(--c1),0.5)", pointerEvents: "none", zIndex: 100000, transition: "border-color 0.2s" }} />
    </>
  );
}

// ─── Scroll progress bar ───────────────────────────────────────────────────────

function ScrollProgressBar() {
  const p = useScrollProgress();
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 9990, background: "rgba(var(--c1),0.07)" }}>
      <div style={{ height: "100%", width: `${p * 100}%`, background: "linear-gradient(90deg, var(--c1h), var(--c2h))", transition: "width 0.05s linear", boxShadow: "0 0 8px rgba(var(--c1),0.6)" }} />
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
      link: true,
      paused: false,
    };
    function init() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      const w = canvas!.width;
      const count = w < 640 ? 38 : w < 1024 ? 64 : 110;
      state.link = w >= 768;
      state.particles = Array.from({ length: count }, () => ({
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
      if (state.paused) { state.raf = requestAnimationFrame(tick); return; }
      const W = canvas!.width, H = canvas!.height;
      ctx!.fillStyle = "rgba(5,8,20,0.18)";
      ctx!.fillRect(0, 0, W, H);
      state.scanY = (state.scanY + 0.55) % H;
      if (state.scanY < 0.55) {
        ctx!.strokeStyle = "rgba(0,240,255,0.04)";
        ctx!.lineWidth = 0.5;
        const GS = 65;
        for (let x = 0; x < W; x += GS) { ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, H); ctx!.stroke(); }
        for (let y = 0; y < H; y += GS) { ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(W, y); ctx!.stroke(); }
      }
      const sg = ctx!.createLinearGradient(0, state.scanY - 80, 0, state.scanY + 80);
      sg.addColorStop(0, "rgba(0,240,255,0)");
      sg.addColorStop(0.5, "rgba(0,240,255,0.032)");
      sg.addColorStop(1, "rgba(0,240,255,0)");
      ctx!.fillStyle = sg;
      ctx!.fillRect(0, state.scanY - 80, W, 160);
      const { particles, mouse } = state;
      const linkDraw = state.link;
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
        if (linkDraw) {
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
    "Software Engineer with 6+ years of experience, M.A. student in Computational Linguistics at Tübingen. Bridging production-grade full-stack engineering with AI, NLP, and LLM research.",
  bio1:
    "Software Engineer with 6+ years of experience building production-ready, maintainable systems and pixel-perfect UIs using React, Next.js, TypeScript, and modern tooling. Experienced in leading cross-functional teams, improving developer experience, and delivering design-driven applications at scale.",
  bio2:
    "Currently pursuing an M.A. in Computational Linguistics at the University of Tübingen and working as a Student Assistant at IWM & the Autonomous Learning Lab (Uni Tübingen), focusing on AI, ML, LLMs, NLP, and Cognitive Science — bridging software engineering and intelligent systems. Open to Working Student & internship roles in NLP, AI/ML, and LLMs — Tübingen, Stuttgart, or remote.",
};

// ─── Style helpers (module-level so all components can use them) ──────────────

const mono = (sz: number, color = "var(--fg-b)", extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: '"JetBrains Mono", monospace', fontSize: sz, color, ...extra,
});
const raj = (sz: number, color = "var(--fg-a)"): React.CSSProperties => ({
  fontFamily: '"Rajdhani", sans-serif', fontSize: sz, fontWeight: 700, color,
});
const body = (sz: number, color = "var(--fg-b)"): React.CSSProperties => ({
  fontFamily: '"Outfit", sans-serif', fontSize: sz, color, lineHeight: 1.8,
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
    <div style={{ overflow: "hidden", borderTop: "1px solid rgba(var(--c1),0.08)", borderBottom: "1px solid rgba(var(--c1),0.08)", padding: "14px 0", position: "relative", zIndex: 10 }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="ticker-track" style={{ display: "flex", gap: 40, width: "max-content", animation: "ticker 28s linear infinite", animationPlayState: paused ? "paused" : "running" }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.25em", color: i % 3 === 0 ? "var(--c1h)" : i % 3 === 1 ? "var(--c2h)" : "var(--fg-d)", textTransform: "uppercase", whiteSpace: "nowrap", userSelect: "none", display: "flex", alignItems: "center", gap: 12, transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), color 0.25s, letter-spacing 0.25s", cursor: "pointer" }}
            className="ticker-item" onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.28) translateY(-3px)"; e.currentTarget.style.letterSpacing = "0.34em"; (e.currentTarget.children[0] as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.letterSpacing = "0.25em"; (e.currentTarget.children[0] as HTMLElement).style.opacity = "0.2"; }}>
            {item} <span style={{ color: "rgba(var(--c1),0.4)", margin: "0 4px", opacity: 0.2, transition: "opacity 0.25s" }}>◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Quantum bomb (joy) ───────────────────────────────────────────────────────

type Spark = {
  id: number; x: number; y: number; dx: number; dy: number; size: number; color: string; life: number; rot: number; shape: "dot" | "square";
};

let bombCtx: AudioContext | null = null;
function getBombCtx() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!bombCtx) bombCtx = new AC();
  if (bombCtx.state === "suspended") bombCtx.resume();
  return bombCtx;
}

function playBombSound() {
  const ctx = getBombCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.setValueAtTime(1.2, now);
  master.gain.exponentialRampToValueAtTime(0.0005, now + 7.2);
  master.connect(ctx.destination);
  const env = (g: GainNode, t: number, a: number, t2: number, d: number) => {
    g.gain.setValueAtTime(a, t);
    g.gain.exponentialRampToValueAtTime(d, t2);
  };
  const noiseBuffer = (secs: number, brown = true) => {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * secs), ctx.sampleRate);
    const d = b.getChannelData(0);
    if (brown) {
      let last2 = 0;
      for (let i = 0; i < d.length; i++) { last2 = (last2 + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last2 * 4; }
    } else {
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return b;
  };
  // aggressive random micro-jitter → gritty, chaotic noise instead of clean tones
  const jitter = (g: GainNode, from: number, dur: number, base: number, amp: number, step = 0.025, seed = Math.random) => {
    let t = from;
    while (t < from + dur) {
      g.gain.setValueAtTime(Math.max(0.0005, base + (seed() * 2 - 1) * amp), t);
      t += step;
    }
  };

  // hard-clipped distortion for that scarred, crushed nuclear edge
  const clip = ctx.createWaveShaper();
  const curve = new Float32Array(2048);
  for (let i = 0; i < 2048; i++) {
    const x = (i / 2048) * 2 - 1;
    curve[i] = (Math.tanh(x * 5.5) / Math.tanh(5.5)) * 1.18;
  }
  clip.curve = curve;

  // 1) THE KABOOM — massive clipped pressure front
  const kaboom = ctx.createBufferSource();
  kaboom.buffer = noiseBuffer(1.0, false);
  const kf = ctx.createBiquadFilter();
  kf.type = "lowpass";
  kf.frequency.setValueAtTime(7500, now);
  kf.frequency.exponentialRampToValueAtTime(200, now + 1.0);
  const kg = ctx.createGain();
  env(kg, now, 0.0005, now + 0.05, 1.9);
  env(kg, now + 0.05, 1.9, now + 1.0, 0.0005);
  kaboom.connect(kf).connect(kg).connect(clip).connect(master);
  kaboom.start(now); kaboom.stop(now + 1.05);

  // 2) foundation sub — violent low end
  const sub = ctx.createOscillator();
  sub.type = "sine";
  sub.frequency.setValueAtTime(110, now);
  sub.frequency.exponentialRampToValueAtTime(20, now + 6.0);
  const subg = ctx.createGain();
  env(subg, now, 0.002, now + 0.09, 1.1);
  env(subg, now + 0.09, 1.1, now + 6.1, 0.0005);
  jitter(subg, now + 0.09, 6.0, 1.0, 0.25, 0.12);
  sub.connect(subg).connect(master);
  sub.start(now); sub.stop(now + 6.2);

  // 3) heavy body roar — walls of air pushed about
  const roar = ctx.createBufferSource();
  roar.buffer = noiseBuffer(5.0, true);
  const rf = ctx.createBiquadFilter();
  rf.type = "lowpass";
  rf.frequency.setValueAtTime(4800, now);
  rf.frequency.exponentialRampToValueAtTime(80, now + 5.0);
  rf.Q.value = 1.4;
  const rg = ctx.createGain();
  env(rg, now, 0.0005, now + 0.22, 1.15);
  env(rg, now + 0.22, 1.15, now + 5.0, 0.0005);
  jitter(rg, now + 0.22, 4.9, 1.0, 0.4, 0.05);
  roar.connect(rf).connect(rg).connect(clip).connect(master);
  roar.start(now); roar.stop(now + 5.05);

  // 4) sizzling static — thick hissy air, chaotic crackle-swirl
  const sizzle = ctx.createBufferSource();
  sizzle.buffer = noiseBuffer(4.2, false);
  const sf = ctx.createBiquadFilter();
  sf.type = "highpass"; sf.frequency.value = 2600;
  const sf2 = ctx.createBiquadFilter();
  sf2.type = "bandpass"; sf2.frequency.value = 5200; sf2.Q.value = 0.7;
  const sg = ctx.createGain();
  env(sg, now, 0.0005, now + 0.3, 0.4);
  jitter(sg, now + 0.3, 3.7, 0.4, 0.38, 0.018);
  env(sg, now + 3.7, sg.gain.value, now + 4.2, 0.0005);
  sizzle.connect(sf).connect(sf2).connect(sg).connect(master);
  sizzle.start(now); sizzle.stop(now + 4.25);

  // 5) rolling distant explosions — staggered thunder through the decay
  const roll = ctx.createBufferSource();
  roll.buffer = noiseBuffer(6.0, true);
  const rollf = ctx.createBiquadFilter();
  rollf.type = "lowpass"; rollf.frequency.value = 380;
  const rollg = ctx.createGain();
  rollg.gain.setValueAtTime(0.001, now);
  let tRoll = now + 0.6;
  while (tRoll < now + 5.8) {
    const vol = 0.06 + Math.random() * 0.34;
    rollg.gain.setValueAtTime(0.001, tRoll);
    rollg.gain.linearRampToValueAtTime(vol, tRoll + 0.05);
    rollg.gain.exponentialRampToValueAtTime(0.001, tRoll + 0.4 + Math.random() * 0.8);
    tRoll += 0.28 + Math.random() * 0.6;
  }
  roll.connect(rollf).connect(rollg).connect(master);
  roll.start(now); roll.stop(now + 5.9);

  // 6) chaotic aftershock pulses — irregular low drops still hitting minutes later
  for (let k = 0; k < 5; k++) {
    const t = now + 2.2 + Math.random() * 3.6;
    const pulse = ctx.createOscillator();
    pulse.type = "sine";
    pulse.frequency.setValueAtTime(60 + Math.random() * 40, t);
    pulse.frequency.exponentialRampToValueAtTime(26 + Math.random() * 10, t + 0.7);
    const pgg = ctx.createGain();
    env(pgg, t, 0.001, t + 0.06, 0.5);
    env(pgg, t + 0.06, 0.5, t + 0.75, 0.001);
    pulse.connect(pgg).connect(master);
    pulse.start(t); pulse.stop(t + 0.8);
  }

  // 7) granular fire crackle — hundreds of debris pops raining down
  const popBuf = noiseBuffer(0.035, false);
  for (let k = 0; k < 170; k++) {
    const t = now + 0.6 + Math.random() * 4.0;
    const pop = ctx.createBufferSource();
    pop.buffer = popBuf;
    const pf = ctx.createBiquadFilter();
    pf.type = "bandpass";
    pf.frequency.value = 800 + Math.random() * 5200;
    pf.Q.value = 9;
    const pg = ctx.createGain();
    pg.gain.setValueAtTime(0.001, t);
    pg.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.16, t + 0.007);
    pg.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    pop.connect(pf).connect(pg).connect(master);
    pop.start(t); pop.stop(t + 0.06);
  }

  // 8) ear-shattering sharp crack at ignition
  const snap = ctx.createBufferSource();
  snap.buffer = noiseBuffer(0.15, false);
  const hpf = ctx.createBiquadFilter();
  hpf.type = "highpass"; hpf.frequency.value = 4200;
  const snG = ctx.createGain();
  env(snG, now, 1.0, now + 0.16, 0.0005);
  snap.connect(hpf).connect(snG).connect(master);
  snap.start(now); snap.stop(now + 0.17);

  // 9) shockwave sweep pierces through the wall of noise
  const boom = ctx.createOscillator();
  boom.type = "sine";
  boom.frequency.setValueAtTime(2800, now);
  boom.frequency.exponentialRampToValueAtTime(140, now + 1.3);
  const bg = ctx.createGain();
  env(bg, now, 0.0005, now + 0.12, 0.95);
  env(bg, now + 0.12, 0.95, now + 1.35, 0.0005);
  boom.connect(bg).connect(clip).connect(master);
  boom.start(now); boom.stop(now + 1.4);
}

function playWhooshSound() {
  const ctx = getBombCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.0), ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(3400, now);
  f.frequency.exponentialRampToValueAtTime(380, now + 1.0);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0005, now);
  g.gain.linearRampToValueAtTime(0.5, now + 0.14);
  g.gain.exponentialRampToValueAtTime(0.0005, now + 1.0);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(now); src.stop(now + 1.02);
}

function QuantumBomb() {
  const [armed, setArmed] = useState(true);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [shocking, setShocking] = useState(false);
  const [blast, setBlast] = useState<{ x: number; y: number } | null>(null);
  const [afterglow, setAfterglow] = useState(false);
  const [flash, setFlash] = useState(false);
  const [embers, setEmbers] = useState<{ x: number; y: number; dx: number; dur: number; s: number }[]>([]);
  const [smoke, setSmoke] = useState<{ x: number; y: number; sx: number; sy: number; s: number; d: number }[]>([]);
  const [rock, setRock] = useState<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const idRef = useRef(0);

  const launchRock = (sx: number, sy: number) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setArmed(false);
    playWhooshSound();
    setRock({ x: sx, y: sy, fx: cx - sx, fy: cy - sy });
    setTimeout(() => {
      setRock(null);
      detonate(cx, cy);
      setTimeout(() => setArmed(true), 2600);
    }, 1000);
  };

  const detonate = (cx: number, cy: number) => {
    playBombSound();
    const small = window.innerWidth < 640;
    const colors = ["var(--c1h)", "var(--c2h)", "var(--c3h)", "var(--c4h)", "#ffffff"];
    const dg = ["#caa06a", "#b7aca6", "#9a8b83", "var(--c4h)", "#6b5f58"];
    const parts: Spark[] = [];
    const nSmall = small ? 56 : 140;
    for (let i = 0; i < nSmall; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 14;
      parts.push({
        id: ++idRef.current,
        x: cx, y: cy,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 2.5,
        size: 1.5 + Math.random() * 5,
        shape: Math.random() > 0.65 ? "square" : "dot",
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0.55 + Math.random() * 0.95,
        rot: Math.random() * 360,
      });
    }
    const nBig = small ? 4 : 10;
    for (let i = 0; i < nBig; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      parts.push({
        id: ++idRef.current,
        x: cx, y: cy,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 3.5,
        size: 14 + Math.random() * 20,
        shape: "square",
        color: dg[Math.floor(Math.random() * dg.length)],
        life: 1.6 + Math.random() * 1.1,
        rot: Math.random() * 360,
      });
    }
    setSparks(parts);
    setShocking(true);
    setBlast({ x: cx, y: cy });
    setAfterglow(true);
    setFlash(true);
    setEmbers(Array.from({ length: small ? 10 : 24 }, () => ({
      x: cx + (Math.random() - 0.5) * 220,
      y: cy + (Math.random() - 0.5) * 40,
      dx: (Math.random() - 0.5) * 180,
      dur: 0.9 + Math.random() * 1.3,
      s: 3 + Math.random() * 6,
    })));
    setSmoke(Array.from({ length: small ? 5 : 9 }, () => ({
      x: cx + (Math.random() - 0.5) * 120,
      y: cy + (Math.random() - 0.5) * 40,
      sx: (Math.random() - 0.5) * 460,
      sy: -(60 + Math.random() * 260),
      s: 90 + Math.random() * 130,
      d: 2.2 + Math.random() * 1.2,
    })));
    setTimeout(() => setShocking(false), 1200);
    setTimeout(() => setAfterglow(false), 1400);
    setTimeout(() => setFlash(false), 700);
    setTimeout(() => setSparks([]), 2700);
    setTimeout(() => setEmbers([]), 2400);
    setTimeout(() => setSmoke([]), 3600);
    setTimeout(() => setBlast(null), 1600);
  };

  return (
    <>
      {shocking && <div style={{ position: "fixed", inset: 0, zIndex: 9890, pointerEvents: "none", animation: "bomb-shake 0.45s linear" }} />}
      {flash && <div className="nuke-flash" style={{ position: "fixed", inset: 0, zIndex: 9855, pointerEvents: "none", background: "radial-gradient(circle at 50% 60%, rgba(255,255,235,1), rgba(255,220,160,0.9) 45%, rgba(255,255,255,0) 70%)", animation: "nuke-flash 0.65s ease-out forwards" }} />}
      {smoke.length > 0 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9864, pointerEvents: "none", overflow: "hidden", mixBlendMode: "normal" }}>
          {smoke.map((p, i) => (
            <div key={i} className="nuke-smoke" style={{
              position: "absolute", left: p.x, top: p.y, width: p.s, height: p.s,
              ['--sx' as string]: `${p.sx}px`, ['--sy' as string]: `${p.sy}px`,
              ['--sd' as string]: `${p.d}s`,
            }} />
          ))}
        </div>
      )}
      {afterglow && <div style={{ position: "fixed", inset: 0, zIndex: 9870, pointerEvents: "none", background: "radial-gradient(circle, rgba(255,255,255,0.28), transparent 60%)", mixBlendMode: "screen", animation: "bomb-afterglow 0.9s ease-out forwards" }} />}
      {blast && (
        <div style={{ position: "fixed", left: blast.x, top: blast.y, zIndex: 9882, pointerEvents: "none" }}>
          {/* heat bloom */}
          <div style={{ position: "absolute", translate: "-50% -50%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,190,80,0.9), rgba(255,120,50,0.4) 45%, rgba(255,80,40,0.12) 68%, transparent 72%)", animation: "nuke-bloom 1.5s cubic-bezier(0.22,1,0.36,1) forwards" }} />
          {/* mushroom stem */}
          <div style={{ position: "absolute", translate: "-50% 0", width: 110, height: 250, borderRadius: "45% 45% 12% 12% / 55% 55% 25% 25%", background: "linear-gradient(to top, rgba(255,170,90,0.95), rgba(255,200,140,0.55) 45%, rgba(255,220,180,0.2) 75%, transparent)", filter: "blur(1.5px)", animation: "nuke-stem 1.8s cubic-bezier(0.22,1,0.36,1) forwards" }} />
          {/* mushroom cap */}
          <div style={{ position: "absolute", top: 0, left: 0, translate: "-50% -50%", width: 460, height: 260, borderRadius: "50%", background: "radial-gradient(ellipse at 50% 62%, rgba(255,120,50,0.85), rgba(220,80,70,0.55) 42%, rgba(150,70,80,0.3) 68%, transparent 75%)", filter: "blur(2px)", animation: "nuke-head 1.9s cubic-bezier(0.22,1,0.36,1) forwards" }} />
        </div>
      )}
      {embers.length > 0 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9875, pointerEvents: "none", overflow: "hidden" }}>
          {embers.map((e, i) => (
            <div key={i} style={{
              position: "absolute", left: e.x, top: e.y, width: e.s, height: e.s, borderRadius: "50%",
              background: "linear-gradient(180deg, #fff3c4, var(--c4h))", boxShadow: "0 0 12px rgba(255,160,60,0.9)",
              ['--ex' as string]: `${e.dx}px`, ['--ey' as string]: `${-260 - Math.random() * 120}px`,
              ['--ed' as string]: `${e.dur}s`,
            }} className="ember-rise" />
          ))}
        </div>
      )}
      {rock && (
        <div style={{ position: "fixed", left: rock.x, top: rock.y, zIndex: 9888, pointerEvents: "none" }}>
          {[{ d: -0.3, o: 0.25, s: 34 }, { d: -0.18, o: 0.5, s: 26 }, { d: 0, o: 1, s: 20 }].map((g, i) => (
            <div key={i} className="atomic-rock" style={{
              position: "absolute", width: g.s, height: g.s, borderRadius: "50%",
              background: "radial-gradient(circle at 34% 30%, #fff3c4, #ffb03a 30%, #ff5a1f 65%, #7a2410 95%)",
              boxShadow: "0 0 18px 6px rgba(255,120,30,0.85), 0 0 46px 18px rgba(255,60,20,0.45)",
              ['--fx' as string]: `${rock.fx}px`, ['--fy' as string]: `${rock.fy}px`,
              opacity: g.o, animationDelay: `${g.d}s`,
            }} />
          ))}
        </div>
      )}
      {sparks.length > 0 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9880, pointerEvents: "none", overflow: "hidden" }}>
          {sparks.map((s) => (
            <div key={s.id} className="bomb-spark" style={{
              position: "absolute", left: s.x, top: s.y, width: s.size, height: s.size,
              background: s.color, boxShadow: s.shape === "square" ? "none" : `0 0 10px ${s.color}`,
              borderRadius: s.shape === "square" ? "1px" : "50%",
              ['--sx' as string]: `${s.dx * 45}px`, ['--sy' as string]: `${s.dy * 45}px`,
              ['--sr' as string]: `${s.rot}deg`, ['--sl' as string]: `${s.life}s`,
              ['--srot' as string]: `${s.rot * 3}deg`,
            }} />
          ))}
        </div>
      )}
      <div className="quantum-bomb-float" style={{ position: "fixed", left: 18, bottom: 18, zIndex: 8500 }}>
      <button onClick={(e) => {
        if (!armed) return;
        const r = e.currentTarget.getBoundingClientRect();
        launchRock(r.left + r.width / 2, r.top + r.height / 2);
      }}
        style={{
          cursor: "pointer", position: "relative", width: 52, height: 52,
          background: "linear-gradient(135deg, rgba(var(--c1),0.28), rgba(var(--c3),0.16))",
          border: "1px solid rgba(var(--c1),0.5)", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(10px)",
          transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), border-color 0.25s, box-shadow 0.25s",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 28px rgba(var(--c1),0.3), 0 0 0 4px rgba(var(--c1),0.07)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "rgba(var(--c4),0.85)"; e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 34px rgba(var(--c1),0.42), 0 0 0 4px rgba(var(--c4),0.14)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(var(--c1),0.5)"; e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.18), 0 8px 28px rgba(var(--c1),0.3), 0 0 0 4px rgba(var(--c1),0.07)"; }}
        aria-label="Launch the atomic rocket">
        <span className="bomb-ping" style={{ position: "absolute", inset: -3, borderRadius: "50%", pointerEvents: "none" }} />
        <span style={{
          width: 34, height: 34, borderRadius: "50%",
          background: armed
            ? "radial-gradient(circle at 32% 30%, var(--c4h), var(--c1h))"
            : "radial-gradient(circle at 32% 30%, rgba(var(--c2),0.5), rgba(var(--fg-d),0.3))",
          color: "var(--bg-deep)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: armed ? "0 0 14px rgba(var(--c4),0.7), inset 0 -2px 5px rgba(0,0,0,0.28)" : "none",
          transition: "background 0.4s, box-shadow 0.4s",
          animation: armed ? "" : "reload-blink 1.1s ease-in-out infinite",
        }}>
          <Atom size={19} strokeWidth={2} className={armed ? "atom-spin" : ""} />
        </span>
      </button>
      </div>
    </>
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
            color: i % 2 === 0 ? "rgba(var(--c1),0.07)" : "rgba(var(--c2),0.07)",
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
    <div ref={ref} className="flex items-center gap-4 mb-6">
      <span className={`neon-flicker ${vis ? "glitch-enter" : ""}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: "0.28em", color: "rgba(var(--c1),0.7)", textTransform: "uppercase" as const }}>
        MODULE_{num}
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, rgba(var(--c1),0.3), transparent)", transform: vis ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left", transition: "transform 1s ease 0.2s" }} />
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: "0.2em", color: "rgba(var(--c1),0.5)", textTransform: "uppercase" as const, opacity: vis ? 1 : 0, transition: "opacity 0.6s ease 0.8s" }}>
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
        <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: 15, color: "var(--fg-hero)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "flex", gap: 2.5 }}>
            {Array.from({ length: segments }).map((_, i) => (
              <span key={i}
                style={{
                  width: 6, height: 10,
                  background: i < filled && visible ? "linear-gradient(180deg, var(--c1h), var(--c2h))" : "var(--chip)",
                  transition: "background 0.5s ease, box-shadow 0.5s ease",
                  transitionDelay: `${delay + i * 70}ms`,
                  boxShadow: i < filled && visible ? "0 0 6px rgba(var(--c1),0.35)" : "none",
                  opacity: visible ? 1 : 0,
                }}
              />
            ))}
          </span>
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 8.5, letterSpacing: "0.16em", color: level >= 78 ? "var(--c1h)" : "var(--fg-c)" }}>{tier}</span>
        </span>
      </div>
    </div>
  );
}

// ─── Focus chips ─────────────────────────────────────────────────────────────

const FOCUS_ITEMS = ["NLP", "LLMs", "ML / Deep Learning", "Comp. Linguistics", "Multilingual AI", "AI Research"];

function FocusStrip() {
  const { ref, visible } = useReveal(0.15);
  const bg = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c1)", "var(--c2)", "var(--c4)"];
  const hexs = ["var(--c1h)", "var(--c2h)", "var(--c3h)", "var(--c1h)", "var(--c2h)", "var(--c4h)"];
  return (
    <div ref={ref} className="flex flex-wrap items-center gap-3" style={{ margin: "0 0 36px", maxWidth: 800 }}>
      <span className={visible ? "wipe-in" : ""} style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(var(--c1),0.5)" }}>FOCUS://</span>
      {FOCUS_ITEMS.map((t, i) => (
        <span key={t} className={visible ? "badge-in" : ""}
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontWeight: 500, fontSize: 10,
            letterSpacing: "0.18em", textTransform: "uppercase", padding: "6px 12px",
            color: hexs[i % hexs.length],
            background: `rgba(${bg[i % bg.length]},0.05)`, animationDelay: `${i * 120}ms`, opacity: visible ? 1 : 0,
            cursor: "default", transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s, background 0.25s, opacity 0.5s",
          }}
          onMouseEnter={(e) => { const el = e.currentTarget; el.style.transform = "translateY(-3px)"; el.style.background = `rgba(${bg[i % bg.length]},0.12)`; }}
          onMouseLeave={(e) => { const el = e.currentTarget; el.style.transform = "translateY(0)"; el.style.background = `rgba(${bg[i % bg.length]},0.05)`; }}>
          {t}
        </span>
      ))}
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

  useEffect(() => {
    const stored = localStorage.getItem(CMS_TOKEN_KEY);
    if (stored) verify(stored, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div style={{ padding: "10vh 8vw" }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: "rgba(var(--c1),0.4)", letterSpacing: "0.3em", marginBottom: 32 }}>
            HAZEM_ALABIAD_OS // BOOT SEQUENCE
          </div>
          <div className="space-y-2">
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
          <div style={{ position: "fixed", bottom: 28, right: 40, fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.25em", color: "rgba(var(--c1),0.45)" }}>
            TAP OR ENTER ↵ — SKIP BOOT
          </div>
        </div>
      ) : (
        <div className="welcome-desktop">
          {/* desktop icons */}
          <div className="welcome-icons" style={{ position: "absolute", top: 40, left: 40, display: "flex", flexDirection: "column", gap: 22, zIndex: 2 }}>
            {APPS.map(({ Icon, label, color }, i) => (
              <div key={label} className="welcome-icon" style={{ animationDelay: `${i * 90}ms`, cursor: "none", zIndex: 2 }}>
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
            <div className="blink" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.35em", color: "rgba(var(--c1),0.6)", marginTop: 26, cursor: "none" }}>
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
              <button onClick={launch} className="welcome-start" style={{ cursor: "none", display: "flex", alignItems: "center", gap: 10, padding: "9px 22px", border: "1px solid rgba(var(--c1),0.6)", background: "rgba(var(--c1),0.12)", fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.25em", fontWeight: 700 }}>
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
            background: age > 0.5 ? "rgba(var(--c2),0.4)" : "rgba(var(--c1),0.35)",
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
            style={{ cursor: "none", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", padding: 0 }}>
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
  light: "DAYLIGHT",
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
    <div className={`relative p-5 transition-colors duration-300 ${visible ? "depth-rise" : "opacity-0"} ${exp.current ? "glow-border" : ""}`}
      style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.07)", animationDelay: `${idx * 110}ms` }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.35)"; (e.currentTarget as HTMLElement).style.background = "var(--card-hover)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = exp.current ? "" : "rgba(var(--c1),0.07)"; (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}>
      <button onClick={() => setOpen(!open)} className="w-full text-left" style={{ cursor: "pointer", background: "none", border: "none", padding: 0, fontFamily: "inherit", color: "inherit" }}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
          <div>
            <h3 style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 17, color: "var(--fg-a)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              {exp.role}
              <span style={{ color: "var(--c1h)", fontSize: 11, flexShrink: 0, transition: "transform 0.3s ease", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span style={mono(10, "var(--c2h)", { letterSpacing: "0.12em" })}>{exp.company}</span>
              {exp.location && <span style={mono(10, "var(--fg-c)")}>// {exp.location}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {exp.current && <span style={mono(9, "var(--c1h)", { padding: "2px 8px", border: "1px solid rgba(var(--c1),0.3)", letterSpacing: "0.2em" })}>CURRENT</span>}
            <span style={mono(9, "var(--fg-c)")}>{exp.period}</span>
          </div>
        </div>
      </button>
      <div style={{ display: "grid", gridTemplateRows: open ? "1fr" : "0fr", transition: "grid-template-rows 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ overflow: "hidden" }}>
          <ul className="space-y-1 mb-4">
            {exp.bullets.map((b, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span style={{ color: "var(--c1h)", marginTop: 7, flexShrink: 0, fontSize: 5 }}>◆</span>
                <span style={body(15)}>{b}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-1.5">
            {exp.tags.map((tag) => (
              <span key={tag} style={mono(9, "var(--c2h)", { padding: "2px 8px", border: "1px solid rgba(var(--c2),0.25)" })}>{tag}</span>
            ))}
          </div>
        </div>
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

  // parallax without React re-renders — direct rAF writes to the DOM
  useEffect(() => {
    let raf = 0;
    if (heroNameRef.current) heroNameRef.current.style.willChange = "transform";
    if (heroTagRef.current) heroTagRef.current.style.willChange = "transform";
    const upd = () => {
      const y = window.scrollY;
      if (heroNameRef.current) heroNameRef.current.style.transform = `translateY(${y * 0.18}px)`;
      if (heroTagRef.current) heroTagRef.current.style.transform = `translateY(${y * 0.09}px)`;
      raf = requestAnimationFrame(upd);
    };
    raf = requestAnimationFrame(upd);
    return () => cancelAnimationFrame(raf);
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


  const progress = useScrollProgress();
  // Subtle hue shift: cyan tint near top, violet near bottom
  const bgHue = `radial-gradient(ellipse at ${50 + progress * 20}% ${50 + progress * 30}%, rgba(${Math.round(157 * progress)},${Math.round(78 * progress)},${Math.round(221 * progress)},0.04) 0%, transparent 70%)`;

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg-page)", color: "var(--fg-a)", cursor: "none" }}>
      {!booted && <BootScreen onDone={() => setBooted(true)} />}
      {/* Scroll-reactive ambient background */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: bgHue, transition: "background 0.3s ease" }} />
      <CustomCursor />
      <MouseTrail />
      <ScrollProgressBar />
      <SideNavDots />
      <CRTOverlay />
      <ParticleField />
      <QuantumBomb />

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
      <section id="home" className="relative min-h-screen flex flex-col justify-center px-6 pt-20" style={{ zIndex: 10 }}>
        <FloatingCode />
        {/* Ambient orbs */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 pointer-events-none" style={{ borderRadius: "50%", background: "radial-gradient(circle, rgba(var(--c1),0.07) 0%, transparent 70%)", filter: "blur(40px)", animation: "orb-drift-1 14s ease-in-out infinite" }} />
        <div className="absolute bottom-1/3 left-1/5 w-64 h-64 pointer-events-none" style={{ borderRadius: "50%", background: "radial-gradient(circle, rgba(var(--c2),0.07) 0%, transparent 70%)", filter: "blur(40px)", animation: "orb-drift-2 18s ease-in-out infinite" }} />
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span style={mono(9, "rgba(var(--c1),0.45)", { letterSpacing: "0.35em" })}>NEURAL_ID::HAZ-2026-ALA-TBN</span>
            <div className="w-16 h-px" style={{ background: "rgba(var(--c1),0.18)" }} />
            <span style={mono(9, "rgba(var(--c2),0.45)", { letterSpacing: "0.3em" })}>2026.08.01</span>
            <div className="flex-1" />
            <span className="flex items-center gap-2" style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: "0.22em", color: "var(--c3h)", border: "1px solid rgba(var(--c3),0.35)", background: "rgba(var(--c3),0.06)", padding: "6px 12px", animation: "badge-in 0.8s cubic-bezier(0.16,1,0.3,1) 0.6s both" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--c3h)] pulse-dot" />
              OPEN TO ROLES — NLP · LLM · AI
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Left — identity, role, bio, CTAs, stats */}
            <div className="lg:col-span-7">
              <h1 ref={heroNameRef} className="glitch leading-none tracking-tight mb-4 select-none"
                style={{ fontFamily: '"Audiowide", cursive', fontSize: "clamp(3.2rem,10vw,8.5rem)", fontWeight: 400, color: "var(--fg-a)" }}>
                HAZEM<br /><span className="text-glow-cyan" style={{ color: "var(--c1h)" }}>ALABIAD</span>
              </h1>

              <div className="flex items-center gap-2 mb-6">
                <div className="blink w-2 h-5 bg-[var(--c1h)]" />
                <p style={mono(14, "var(--fg-hero)", { letterSpacing: "0.14em", fontSize: "clamp(14px,1.9vw,19px)" })}>{typeText}</p>
              </div>

              <p ref={heroTagRef} {...ep("heroTagline", DEFAULTS.heroTagline, { ...body(21, "var(--fg-hero)"), maxWidth: 760, marginBottom: 20 })}>
                {get("heroTagline", DEFAULTS.heroTagline)}
              </p>

              <p {...ep("bio1", DEFAULTS.bio1, { ...body(16, "var(--fg-b)"), maxWidth: 720, marginBottom: 32 })}>
                {get("bio1", DEFAULTS.bio1)}
              </p>

              <FocusStrip />

              <div className="flex flex-wrap gap-4 mb-8">
                <MagneticWrap>
                  <button onClick={() => scrollTo("experience")} className="flex items-center gap-3 transition-all duration-300"
                    style={mono(10, "var(--c1h)", { padding: "12px 24px", border: "1px solid var(--c1h)", letterSpacing: "0.2em", cursor: "none" })}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--c1h)"; (e.currentTarget as HTMLElement).style.color = "var(--bg-page)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--c1h)"; }}>
                    VIEW EXPERIENCE <ArrowUpRight size={13} />
                  </button>
                </MagneticWrap>
                <MagneticWrap>
                  <button onClick={() => scrollTo("contact")} className="flex items-center gap-3 transition-all duration-300"
                    style={mono(10, "var(--c2h)", { padding: "12px 24px", border: "1px solid rgba(var(--c2),0.5)", letterSpacing: "0.2em", cursor: "none" })}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--c2h)"; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--c2h)"; }}>
                    CONTACT <Mail size={13} />
                  </button>
                </MagneticWrap>
                <CVDownloadButton cvUrl={content.cvDataUrl} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl">
                {content.stats.map(({ to, suffix, label }) => (
                  <div key={label} className="pl-4" style={{ borderLeft: "2px solid rgba(var(--c1),0.2)" }}>
                    <div style={{ fontFamily: '"Audiowide", cursive', fontSize: "1.6rem", color: "var(--c1h)" }}>
                      {suffix.startsWith("2.2") ? suffix : <CountUp to={to} suffix={suffix} />}
                    </div>
                    <div style={mono(9, "var(--fg-c)", { letterSpacing: "0.16em", marginTop: 4, textTransform: "uppercase" as const })}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Photo + quick facts, merged from About */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex justify-center lg:justify-end">
                <div className="group relative inline-block cursor-pointer"
                  style={{ filter: "drop-shadow(0 0 26px rgba(var(--c1),0.16))" }}>
                  <div className="group-hover:opacity-100" style={{
                    position: "absolute", inset: -12, borderRadius: "28px",
                    background: "radial-gradient(circle, rgba(var(--c1),0.26) 0%, rgba(var(--c2),0.16) 45%, transparent 70%)",
                    zIndex: 0, opacity: 0.55, transition: "opacity 0.4s ease", filter: "blur(3px)",
                  }} />
                  <div style={{
                    width: 148, height: 148, borderRadius: 16, overflow: "hidden",
                    border: "2px solid var(--bg-page)", position: "relative", zIndex: 1,
                    background: "var(--card-photo)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
                  }} className="group-hover:scale-105">
                    <img
                      src={content.photo || hazemPhoto}
                      alt="Hazem Alabiad"
                      loading="lazy"
                      decoding="async"
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 40%", display: "block" }}
                    />
                    {/* elegant blend — quiet the photo background, focus the centre */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(var(--bg-rgb),0.10) 0%, transparent 42%, rgba(var(--bg-rgb),0.62) 100%), radial-gradient(ellipse 78% 72% at 50% 42%, transparent 52%, rgba(var(--bg-rgb),0.5) 100%)", pointerEvents: "none" }} />
                    {/* RGB-split glitch fringes */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(var(--c1),0.16), transparent 45%, transparent 55%, rgba(var(--c2),0.20))", mixBlendMode: "screen" }} />
                    {/* CRT halftone scanlines */}
                    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 3px)", mixBlendMode: "multiply" }} />
                    {/* moving scan sweep */}
                    <div style={{ position: "absolute", left: 0, right: 0, height: "55%", top: "-60%", background: "linear-gradient(to bottom, transparent, rgba(var(--c1),0.14) 50%, transparent)", animation: "scan-cv 5.5s linear infinite" }} />
                    {/* targeting reticle */}
                    <div style={{ position: "absolute", left: "50%", top: "50%", width: 44, height: 44, transform: "translate(-50%,-50%)", opacity: 0.5, pointerEvents: "none" }}>
                      <span style={{ position: "absolute", left: 0, top: "50%", width: 8, height: 1, background: "var(--c1h)", boxShadow: "0 0 6px var(--c1h)" }} />
                      <span style={{ position: "absolute", right: 0, top: "50%", width: 8, height: 1, background: "var(--c1h)", boxShadow: "0 0 6px var(--c1h)" }} />
                      <span style={{ position: "absolute", top: 6, left: "50%", width: 1, height: 8, background: "var(--c1h)", boxShadow: "0 0 6px var(--c1h)" }} />
                      <span style={{ position: "absolute", bottom: 6, left: "50%", width: 1, height: 8, background: "var(--c1h)", boxShadow: "0 0 6px var(--c1h)" }} />
                    </div>
                    {/* corner HUD brackets */}
                    {[{ t: 6, l: 6, w: 16, h: 16, br: "4px 0 0 0", bd: "2px solid rgba(var(--c1),0.85)" },
                      { t: 6, l: "auto", r: 6, w: 16, h: 16, br: "0 6px 0 0", bd: "2px solid rgba(var(--c2),0.85)" },
                      { t: "auto", b: 6, l: 6, w: 16, h: 16, br: "0 0 0 4px", bd: "2px solid rgba(var(--c2),0.85)" },
                      { t: "auto", b: 6, r: 6, w: 16, h: 16, br: "0 0 4px 0", bd: "2px solid rgba(var(--c1),0.85)" }].map((c, i) => (
                      <span key={i} style={{ position: "absolute", top: c.t, bottom: c.b, left: c.l, right: c.r, width: c.w, height: c.h, borderTopLeftRadius: i === 0 ? 4 : 0, borderTopRightRadius: i === 1 ? 4 : 0, borderBottomLeftRadius: i === 2 ? 4 : 0, borderBottomRightRadius: i === 3 ? 4 : 0, borderTop: /top/.test(Object.keys(c).join("")) ? "none" : undefined, ...{} }} />
                  ))}
                  </div>
                  {/* readout strip */}
                  <div style={{
                    position: "absolute", left: 8, right: 8, bottom: 8, zIndex: 2, padding: "3px 7px",
                    background: "rgba(var(--bg-rgb),0.72)", borderLeft: "1px solid rgba(var(--c1),0.5)",
                    backdropFilter: "blur(6px)", pointerEvents: "none",
                  }}>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 7.5, letterSpacing: "0.18em", color: "var(--fg-b)" }}>
                      ID:<span style={{ color: "var(--c1h)" }}>HAZ-2026</span>
                      <span className="blink" style={{ color: "var(--c3h)", margin: "0 4px" }}>█</span>
                      <span style={{ color: "rgba(var(--c1),0.6)" }}>SIG_OK</span>
                    </span>
                  </div>
                  <span style={{
                    position: "absolute", bottom: 34, right: 6, zIndex: 2, width: 14, height: 14,
                    borderRadius: "50%", background: "var(--c3h)", border: "3px solid var(--bg-page)",
                    boxShadow: "0 0 10px rgba(var(--c3),0.9)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ position: "absolute", inset: -3, borderRadius: "50%", background: "rgba(var(--c3),0.5)", animation: "pulse-dot 2s ease-out infinite" }} />
                  </span>
                </div>
              </div>

              {/* ── Terminal / job-mode card — right under the photo ── */}
              <div className="p-5 relative overflow-hidden" style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.15)", fontFamily: '"JetBrains Mono", monospace', fontSize: 11, boxShadow: "0 0 26px rgba(var(--c1),0.06)" }}>
                <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 2, background: "linear-gradient(90deg, transparent, rgba(var(--c1),0.28), transparent)", animation: "term-beam 7s linear infinite", pointerEvents: "none" }} />
                <div className="flex gap-2 mb-3 items-center">
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--red-soft)" }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--c4h)" }} />
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--c3h)" }} />
                  <span style={{ color: "var(--fg-c)", fontSize: 9, letterSpacing: "0.15em", marginLeft: 8 }}>
                    hazem@tübingen:~$ <span style={{ color: "var(--c3h)" }}>./job-mode --targets</span><span className="blink" style={{ color: "var(--c1h)" }}>▌</span>
                  </span>
                </div>
                <div style={{ lineHeight: 2 }}>
                  <div style={{ color: "rgba(var(--c1),0.75)", letterSpacing: "0.22em", fontSize: 9, marginBottom: 3 }}>ROLES_LOOKING_FOR:</div>
                  {[
                    { t: "NLP Engineer", p: true },
                    { t: "LLM / AI Engineer", p: false },
                    { t: "Research Engineer · AI/CompLing", p: false },
                    { t: "Full-Stack Engineer", p: false },
                  ].map((r, i) => (
                    <div key={r.t} style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                      <span style={{ color: "var(--c2h)" }}>[{i + 1}]</span>
                      <span style={{ color: "var(--fg-a)" }}>{r.t}</span>
                      {r.p && <span style={{ color: "var(--c3h)" }}>← priority</span>}
                    </div>
                  ))}
                  <div style={{ marginTop: 8 }}>
                    <div><span style={{ color: "var(--c2h)" }}>availability</span> <span style={{ color: "var(--fg-a)" }}>=</span> <span style={{ color: "var(--c3h)" }}>"Immediately"</span></div>
                    <div><span style={{ color: "var(--c2h)" }}>location</span> <span style={{ color: "var(--fg-a)" }}>=</span> <span style={{ color: "var(--c3h)" }}>"{get("factLocation", DEFAULT_CONTENT.factLocation)}"</span></div>
                    <div><span style={{ color: "var(--c2h)" }}>open_to</span> <span style={{ color: "var(--fg-a)" }}>=</span> <span style={{ color: "var(--c1h)" }}>["Full-time", "Working Student", "Remote"]</span></div>
                    <div><span style={{ color: "var(--c2h)" }}>status</span> <span style={{ color: "var(--fg-a)" }}>=</span> <span style={{ color: "var(--c4h)" }}>"Open to opportunities"</span></div>
                  </div>
                </div>
              </div>

<div className="grid grid-cols-2 gap-3">
                {[
                  { Icon: MapPin, label: "Location", value: get("factLocation", DEFAULT_CONTENT.factLocation) },
                  { Icon: GraduationCap, label: "Degree", value: get("factDegree", DEFAULT_CONTENT.factDegree) },
                  { Icon: Briefcase, label: "Current Role", value: get("factCurrent", DEFAULT_CONTENT.factCurrent) },
                  { Icon: Globe, label: "Available", value: get("factAvailable", DEFAULT_CONTENT.factAvailable) },
                ].map(({ Icon, label, value }) => (
                  <div key={label} className="grid grid-cols-1 gap-1 p-3 transition-all duration-300"
                    style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.07)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.28)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(var(--c1),0.07)")}>
                    <div className="flex items-center gap-1.5" style={{ color: "var(--fg-d)" }}>
                      <Icon size={11} style={{ color: "var(--c1h)", opacity: 0.7 }} />
                      <div style={mono(8.5, "var(--fg-c)", { textTransform: "uppercase" as const, letterSpacing: "0.16em" })}>{label}</div>
                    </div>
                    <div style={body(13.5, "var(--fg-a)")}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="float absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" style={{ color: "rgba(var(--c1),0.35)" }}>
          <span style={mono(9, "rgba(var(--c1),0.35)", { letterSpacing: "0.3em" })}>SCROLL</span>
          <ChevronDown size={14} />
        </div>
        <div className="absolute top-24 right-8 w-24 h-24 pointer-events-none" style={{ borderTop: "1px solid rgba(var(--c1),0.12)", borderRight: "1px solid rgba(var(--c1),0.12)" }} />
        <div className="absolute bottom-20 left-8 w-24 h-24 pointer-events-none" style={{ borderBottom: "1px solid rgba(var(--c2),0.12)", borderLeft: "1px solid rgba(var(--c2),0.12)" }} />
      </section>


      {/* ── Experience ── */}
      <section id="experience" className="relative py-10 px-6" style={{ zIndex: 10 }}>
        <div ref={expR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="01" label="EXPERIENCE" />
          <div className="transition-all duration-1000" style={{ opacity: expR.visible ? 1 : 0, transform: expR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-6" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2rem,5vw,3.2rem)", color: "var(--fg-a)" }}>
              Work <span style={{ color: "var(--c2h)" }}>History</span>
            </WipeHeading>
            <div className="space-y-4">
              {content.experience.map((exp, idx) => (
                <ExpEntry key={exp.id || idx} exp={exp} idx={idx} visible={expR.visible} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <SkillTicker />

      {/* ── Projects ── */}
      <section id="projects" className="relative py-10 px-6" style={{ zIndex: 10 }}>
        <div ref={projectsR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="02" label="PROJECTS" />
          <div className="transition-all duration-1000" style={{ opacity: projectsR.visible ? 1 : 0, transform: projectsR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-6" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2rem,5vw,3.2rem)", color: "var(--fg-a)" }}>
              Research <span style={{ color: "var(--c1h)" }}>& Projects</span>
            </WipeHeading>
            <Spotlight className="grid grid-cols-1 md:grid-cols-2 gap-5">
{content.projects.map((proj, pidx) => {
                const ProjIcon = [Brain, Code2, Database, GraduationCap, Globe, Briefcase][pidx % 6];
                const projColor = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)"][pidx % 4];
                const projHex = ["var(--c1h)", "var(--c2h)", "var(--c3h)", "var(--c4h)"][pidx % 4];
                const sc: Record<string, string> = { RESEARCH: "var(--c2h)", COMPLETE: "var(--c3h)", ACTIVE: "var(--c1h)", BETA: "var(--c4h)" };
                return (
                  <TiltCard key={proj.id || proj.name} className={projectsR.visible ? "slide-up-item" : ""} style={{ animationDelay: `${pidx * 120}ms` }}>
                  <div className="relative p-6 overflow-hidden transition-all duration-300 group"
                    style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.07)", height: "100%" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.35)"; (e.currentTarget as HTMLElement).style.background = "var(--card-hover)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.07)"; (e.currentTarget as HTMLElement).style.background = "var(--card)"; }}>
                    {/* shimmer sweep on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" style={{ overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, bottom: 0, width: "50%", background: "linear-gradient(90deg, transparent, rgba(var(--c1),0.04), transparent)", animation: "shimmer-sweep 1.2s ease infinite" }} />
                    </div>
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex items-center justify-center" style={{ width: 40, height: 40, border: `1px solid rgba(${projColor},0.19)`, color: projHex }}>
                        <ProjIcon size={17} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={mono(9, sc[proj.status] || "var(--c4h)", { padding: "2px 8px", border: "1px solid rgba(var(--c1),0.19)", letterSpacing: "0.2em" })}>{proj.status}</span>
                        <span style={mono(9, "var(--fg-c)")}>{proj.year}</span>
                      </div>
                    </div>
                    <h3 className="mb-2 transition-colors duration-200" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 18, color: "var(--fg-a)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--c1h)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--fg-a)")}>
                      {proj.name}
                    </h3>
                    <p className="mb-5" style={body(15)}>{proj.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {proj.tags.map((tag) => (
                        <span key={tag} style={mono(9, "var(--fg-c)", { padding: "2px 7px", background: "var(--chip)" })}>{tag}</span>
                      ))}
                    </div>
                    <a href={proj.link} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 transition-opacity hover:opacity-100"
                      style={mono(9, "var(--c1h)", { opacity: 0.45, textDecoration: "none", letterSpacing: "0.15em" })}>
                      <Github size={11} /> VIEW ON GITHUB
                    </a>
                    <div className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderBottom: "1px solid rgba(var(--c1),0.18)", borderRight: "1px solid rgba(var(--c1),0.18)" }} />
                    <div className="absolute top-0 left-0 w-8 h-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderTop: "1px solid rgba(var(--c1),0.18)", borderLeft: "1px solid rgba(var(--c1),0.18)" }} />
                  </div>
                  </TiltCard>
                );
              })}
            </Spotlight>
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="relative py-10 px-6" style={{ zIndex: 10 }}>
        <div ref={skillsR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="03" label="PROFICIENCIES" />
          <div className="transition-all duration-1000" style={{ opacity: skillsR.visible ? 1 : 0, transform: skillsR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-6" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2rem,5vw,3.2rem)", color: "var(--fg-a)" }}>
              Technical <span style={{ color: "var(--c2h)" }}>Proficiencies</span>
            </WipeHeading>
            <Spotlight className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              <div>
                <div style={mono(9, "rgba(var(--c1),0.45)", { marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>FULL_STACK_ENGINEERING</div>
                <div className="space-y-2.5">
                  {content.skills.filter((s) => s.cat === "stack").map((s, i) => (
                    <SkillBar key={s.id || s.label} label={s.label} level={s.level} visible={skillsR.visible} delay={i * 90} />
                  ))}
                </div>
              </div>
              <div>
                <div style={mono(9, "rgba(var(--c2),0.45)", { marginBottom: 12, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>AI_NLP_RESEARCH</div>
                <div className="space-y-2.5">
                  {content.skills.filter((s) => s.cat === "ai").map((s, i) => (
                    <SkillBar key={s.id || s.label} label={s.label} level={s.level} visible={skillsR.visible} delay={i * 90} />
                  ))}
                </div>
              </div>
            </Spotlight>
            <div className="mt-8 pt-5" style={{ borderTop: "1px solid rgba(var(--c1),0.08)" }}>
              <div style={mono(9, "rgba(var(--c1),0.45)", { marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>SPOKEN_LANGUAGES</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {content.languages.map((lang, i) => {
                  const L = lang.level.toLowerCase();
                  const pct = L.includes("native") ? 100 : L.includes("profic") ? 75 : L.includes("fluent") ? 85 : L.includes("beginner") ? 40 : 60;
                  const filled = Math.round((pct / 100) * 8);
                  return (
                    <div key={lang.id} className="px-4 py-3" style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.1)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 19, color: "var(--fg-a)" }}>{lang.name}</span>
                        <span style={mono(8.5, pct >= 75 ? "var(--c1h)" : "var(--fg-c)", { letterSpacing: "0.14em" })}>{lang.level.toUpperCase()}</span>
                      </div>
                      <div className="flex gap-1" style={{ opacity: skillsR.visible ? 1 : 0, transition: "opacity 0.5s ease", transitionDelay: `${i * 90}ms` }}>
                        {Array.from({ length: 8 }).map((_, k) => (
                          <span key={k} style={{ flex: 1, height: 3, background: k < filled ? "linear-gradient(90deg, var(--c1h), var(--c2h))" : "var(--chip)", transition: "background 0.5s ease", transitionDelay: `${i * 90 + k * 50}ms`, boxShadow: k < filled ? "0 0 5px rgba(var(--c1),0.3)" : "none" }} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="relative py-10 px-6" style={{ zIndex: 10 }}>
        <div ref={contactR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="04" label="CONTACT" />
          <div className="transition-all duration-1000" style={{ opacity: contactR.visible ? 1 : 0, transform: contactR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <WipeHeading className="mb-6" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2rem,5vw,3.2rem)", color: "var(--fg-a)" }}>
                  Get in <span style={{ color: "var(--c1h)" }}>Touch</span>
                </WipeHeading>
                <p className="mb-6" style={body(17)}>{get("contactIntro", DEFAULT_CONTENT.contactIntro)}</p>
                <div className="space-y-3">
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
                    const base = "flex items-center gap-4 p-4 transition-all duration-300";
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
