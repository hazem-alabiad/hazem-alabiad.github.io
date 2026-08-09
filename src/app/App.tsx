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
    "Software Engineer with 6+ years building production-ready, maintainable systems and pixel-perfect UIs in React, Next.js, TypeScript, and modern tooling. Lead cross-functional teams, improve developer experience, and ship design-driven applications at scale. Now M.A. Computational Linguistics @ Uni Tübingen and Student Assistant at IWM & the Autonomous Learning Lab — bridging engineering with AI, ML, LLMs, NLP, and Cognitive Science.",
  bio1:
    "",
  bio2:
    "Open to Working Student & internship roles in NLP, AI/ML, and LLMs — Tübingen, Stuttgart, or remote.",
};

// ─── Style helpers (module-level so all components can use them) ──────────────

const mono = (sz: number, color = "var(--fg-b)", extra: React.CSSProperties = {}): React.CSSProperties => ({
  fontFamily: '"JetBrains Mono", monospace',
  fontSize: `clamp(${Math.max(10.5, Math.round(sz * 0.82))}px, ${((sz * 105) / 1280).toFixed(2)}vw, ${Math.max(sz + 1, 12)}px)`,
  color, ...extra,
});
const raj = (sz: number, color = "var(--fg-a)"): React.CSSProperties => ({
  fontFamily: '"Rajdhani", sans-serif', fontSize: sz, fontWeight: 700, color,
});
const body = (sz: number, color = "var(--fg-b)"): React.CSSProperties => ({
  fontFamily: '"Outfit", sans-serif',
  fontSize: `clamp(${Math.max(14, Math.round(sz * 0.74))}px, ${((sz * 104) / 1280).toFixed(2)}vw, ${Math.max(sz, 15)}px)`,
  color, lineHeight: 1.65,
});

// ─── Sub-components ───────────────────────────────────────────────────────────

// ─── Ambient cursor (precise dot + elastic ring; fine pointers only) ─────────

function AmbientCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.matchMedia("(pointer: fine)").matches &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!enabled) return;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;
    document.documentElement.classList.add("cz-active");
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;
    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx - 3}px, ${my - 3}px, 0)`;
    };
    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      ring.classList.toggle("ring-hot", !!t && !!t.closest('a, button, [role="button"], input, textarea, select, label'));
    };
    const down = () => ring.classList.add("ring-press");
    const up = () => ring.classList.remove("ring-press");
    const loop = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - 17}px, ${ry - 17}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    raf = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove("cz-active");
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, zIndex: 100000, pointerEvents: "none" }} aria-hidden="true">
      <div ref={dotRef} className="cz-dot" />
      <div ref={ringRef} className="cz-ring"><span /></div>
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
    <div ref={ref} className="relative flex items-center gap-4 mb-4">
      <div className="console-frame flex items-center" style={{ position: "relative" }}>
        <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 15, fontWeight: 700, color: "var(--c1h)", letterSpacing: "0.08em", opacity: vis ? 1 : 0, transition: "opacity 0.6s ease" }}>
          {num}
        </span>
        <span className="br-tl" />
        <span className="br-br" />
      </div>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, letterSpacing: "0.28em", color: "var(--fg-hero)", textTransform: "uppercase", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(6px)", transition: "opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s" }}>
        {label}
      </span>
      <div className="module-rule" style={{ transform: vis ? "scaleX(1)" : "scaleX(0)", transition: "transform 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s" }} />
    </div>
  );
}

function SkillListItem({ label, index, visible, delay, accent = "var(--c1h)" }: { label: string; index: number; visible: boolean; delay: number; accent?: string }) {
  return (
    <div className="flex items-baseline gap-3 py-2.5" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`, borderBottom: "1px solid rgba(var(--c1),0.07)" }}>
      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: "0.1em", color: accent, opacity: 0.7 }}>{String(index).padStart(2, "0")}</span>
      <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: 18.5, color: "var(--fg-hero)", letterSpacing: "0.01em" }}>{label}</span>
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

// ─── Impact strip ───────────────────────────────────────────────────────

// ─── CV keyword marquee (single; one per page, under hero) ─────────────────────

const KICKER_WORDS = [
  "NLP", "LLMs", "React", "TypeScript", "GraphQL", "Node.js", "Elasticsearch",
  "Python", "TensorFlow", "Docker", "Cypress", "Puppeteer", "Playwright", "Jest",
  "Computational Linguistics", "Machine Learning", "Data Engineering", "Apollo Federation",
];

function KeywordMarquee() {
  const pair = [...KICKER_WORDS, ...KICKER_WORDS];
  return (
    <div className="kicker-wrap relative overflow-hidden" style={{
      borderTop: "1px solid rgba(var(--c1),0.07)", borderBottom: "1px solid rgba(var(--c1),0.07)",
      background: "linear-gradient(180deg, rgba(var(--c1),0.03), transparent 55%)",
    }} aria-hidden="true">
      <div className="kicker-track" style={{ animation: `marquee-x 38s linear infinite` }}>
        {pair.map((w, i) => (
          <span key={i} style={{ ...mono(11, i % 2 === 0 ? "var(--fg-c)" : "var(--c1h)", { letterSpacing: "0.26em" }), padding: "14px 34px", whiteSpace: "nowrap" }}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

function CurrentFocus() {
  const { ref, visible } = useReveal(0.15);
  const items = [
    { tag: "LLM_AI_TUTOR", text: "Building a working-student LLM AI-tutor at Uni Tübingen — retrieval-augmented tutoring for the Autonomous Learning Lab.", hex: "var(--c1h)" },
    { tag: "IWM_RESEARCH", text: "Social-media & TikTok research at Leibniz-Institut für Wissensmedien (IWM) — scraping, NLP, and behavioral analysis.", hex: "var(--c3h)" },
    { tag: "M.A._THESIS", text: "Computational Linguistics M.A. at Uni Tübingen — Arabic multiword-expression extraction with LLMs + cross-lingual transfer.", hex: "var(--c2h)" },
  ];
  return (
    <section id="focus" className="relative py-16 lg:py-20 px-6" style={{ zIndex: 10, background: "linear-gradient(180deg, transparent, rgba(var(--c1),0.025) 50%, transparent)" }}>
      <div ref={ref} className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transition: "opacity 0.8s ease, transform 0.8s ease" }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--c3h)", boxShadow: "0 0 10px var(--c3h)" }} />
          <span style={mono(11, "var(--fg-a)", { letterSpacing: "0.28em" })}>WHAT I'M WORKING ON NOW</span>
          <span style={{ height: 1, flex: 1, background: "rgba(var(--c1),0.12)", marginLeft: 6 }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((it, i) => (
            <div key={it.tag} className="console-frame p-5"
              style={{ border: "1px solid rgba(var(--c1),0.08)", background: "var(--card)", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: `opacity 0.7s ease ${i * 90}ms, transform 0.7s ease ${i * 90}ms` }}>
              <div className="flex items-center gap-2 mb-3">
                <span style={mono(8.5, it.hex, { padding: "2px 7px", border: "1px solid rgba(var(--c1),0.16)", letterSpacing: "0.16em" })}>{it.tag}</span>
              </div>
              <p style={body(13.5, "var(--fg-b)", { lineHeight: 1.55 })}>{it.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ImpactStrip() {
  const { ref, visible } = useReveal(0.15);
  const cells = [
    { to: 6, suffix: "+", label: "YEARS OF ENGINEERING", sub: "Across enterprise & scale-ups" },
    { to: 2, suffix: ".2M+", label: "USERS SERVED", sub: "GetirJobs, product platform" },
    { to: 1, suffix: "M+", label: "ENTERPRISE USERS", sub: "IBM Data Quality platform" },
    { to: 70, suffix: "%+", label: "TEST COVERAGE", sub: "Enforced via Jest / Cypress / Playwright" },
  ];
  return (
    <div ref={ref} className="px-6 py-12" style={{ zIndex: 10, position: "relative", borderTop: "1px solid rgba(var(--c1),0.08)", borderBottom: "1px solid rgba(var(--c1),0.08)", background: "linear-gradient(180deg, rgba(var(--c1),0.02), transparent 60%)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-8"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.9s ease, transform 0.9s ease" }}>
          {cells.map((c, i) => (
            <div key={c.label} className={i > 0 ? "xl:border-l xl:border-[rgba(var(--c1),0.09)] xl:pl-8" : ""}>
              <div className="flex items-center gap-2 mb-3">
                <span style={mono(9, "var(--fg-d)", { letterSpacing: "0.24em" })}>{String(i + 1).padStart(2, "0")}/{String(cells.length).padStart(2, "0")}</span>
                <span style={{ height: 1, width: 18, background: `var(${["--c1", "--c2", "--c3", "--c4"][i]})`, opacity: 0.5, display: "inline-block" }} />
              </div>
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
  "[ OK ] Indexing production experience…",
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
      style={{ animationDelay: `${idx * 100}ms`, opacity: visible ? 1 : 0, position: "relative", paddingLeft: 28 }}>
      <span style={{ position: "absolute", left: 0, top: 22, bottom: 6, width: 1, background: "linear-gradient(180deg, var(--c1h), rgba(var(--c1),0.08))", opacity: 0.5 }} />
      <span style={{ position: "absolute", left: -3, top: 24, width: 7, height: 7, borderRadius: "50%", background: "var(--bg-page)", border: "1.5px solid var(--c1h)", boxShadow: "0 0 8px rgba(var(--c1),0.4)" }} />
      <button onClick={() => setOpen(!open)} className="w-full text-left flex items-start gap-4 py-4"
        style={{ cursor: "pointer", background: "none", border: "none", padding: "16px 0", fontFamily: "inherit", color: "inherit" }}>
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
      <div style={{ position: "relative", zIndex: 1, display: "contents" }}>{children}</div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

const VISIT_KEY = "hazem_portfolio_couter_v1";
const OWNER_KEY = "hazem_portfolio_owner_v1";
const VISIT_URL = "https://countapi.mileshilliard.com/api/v1";
const VISIT_ID = "hazemalabiad_portfolio_visits";

// Count a visit only when we're fairly sure it's not the owner:
//  * Skip if the browser has ever unlocked the CMS (owner flag persisted).
//  * Skip on localhost / dev / the GitHub Pages preview of the owner.
//  * Skip repeat visits in the same session (counted already).
function countVisits() {
  const readOnly = (): Promise<number | null> =>
    fetch(`${VISIT_URL}/get/${VISIT_ID}`).then((r) => r.json()).then((d) => d.value).catch(() => null);

  try {
    const owner = !!localStorage.getItem(OWNER_KEY) || !!localStorage.getItem(CMS_TOKEN_KEY);
    const counted = sessionStorage.getItem(VISIT_KEY);
    const dev =
      location.hostname === "localhost" ||
      location.hostname === "127.0.0.1" ||
      location.hostname.startsWith("dev.") ||
      location.hostname.endsWith(".preview.app.github.dev") ||
      location.hostname.endsWith(".githubpreview.dev");
    if (owner || counted || dev) {
      return readOnly();
    }
    sessionStorage.setItem(VISIT_KEY, "1");
    return fetch(`${VISIT_URL}/hit/${VISIT_ID}`).then((r) => r.json()).then((d) => d.value).catch(() => null);
  } catch {
    return Promise.resolve(null);
  }
}

// Sets the persistent owner flag so the owner's own browser is never counted.
export function markOwner() {
  try { localStorage.setItem(OWNER_KEY, "1"); } catch {}
}

// ─── Enhanced Terminal (hero right rail) ───────────────────────────────────────
// A real terminal window: traffic-light title bar, typed command, role listing
// with a PRIORITY marker, and a key/value status readout. Bigger mono type than
// the old inline job-mode panel, calmer chrome, movable around the site language.

const TERM_ROLES = [
  { t: "Student Assistant · LLM AI-Tutor", p: true },
  { t: "Student Assistant · IWM Social-Media Research", p: false },
  { t: "NLP Engineer", p: false },
  { t: "Full-Stack Engineer", p: false },
];

const TERM_CLOSED_KEY = "hazem_portfolio_terminal_closed";

function EnhancedTerminal({ factLocation }: { factLocation: string }) {
  const [cmd, setCmd] = useState("");
  const [closed, setClosed] = useState<boolean>(() => {
    try { return localStorage.getItem(TERM_CLOSED_KEY) === "1"; } catch { return false; }
  });
  const CMD = "./job-mode --status";

  const close = () => { setClosed(true); try { localStorage.setItem(TERM_CLOSED_KEY, "1"); } catch {} };
  const restore = () => { setClosed(false); try { localStorage.removeItem(TERM_CLOSED_KEY); } catch {} };

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    if (reduce) { setCmd(CMD); return; }
    const t = setInterval(() => { i++; setCmd(CMD.slice(0, i)); if (i >= CMD.length) clearInterval(t); }, 34);
    return () => clearInterval(t);
  }, []);

  if (closed) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.16)" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--red-soft)", opacity: 0.5 }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e", opacity: 0.5 }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840", opacity: 0.5 }} />
        <span style={mono(10.5, "var(--fg-c)", { letterSpacing: "0.12em", marginLeft: 2 })}>job-mode</span>
        <span style={mono(9.5, "var(--fg-d)", { letterSpacing: "0.14em" })}>— hidden</span>
        <button onClick={restore} style={mono(10, "var(--c1h)", { marginLeft: "auto", letterSpacing: "0.16em", padding: "5px 12px", border: "1px solid rgba(var(--c1),0.35)", background: "rgba(var(--c1),0.06)", cursor: "pointer" })}>RESTORE</button>
      </div>
    );
  }

  return (
    <div className="group" style={{ background: "var(--terminal-bg)", border: "1px solid rgba(var(--c1),0.14)", boxShadow: "0 24px 60px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05) inset", borderRadius: 12, overflow: "hidden" }}>
      {/* macOS-style title bar */}
      <div className="term-titlebar relative flex items-center" style={{ height: 40, borderBottom: "1px solid rgba(var(--c1),0.09)", background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(var(--c1),0.02) 55%, rgba(0,0,0,0.08))" }}>
        {/* traffic lights */}
        <div className="flex items-center gap-2" style={{ padding: "0 0 0 14px", flexShrink: 0 }}>
          <button onClick={close} aria-label="Close terminal" title="Close"
            className="term-dot term-dot-red"
            style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57", border: "1px solid rgba(0,0,0,0.2)", borderTopColor: "rgba(255,255,255,0.35)", padding: 0, cursor: "pointer", position: "relative", fontSize: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 8px rgba(255,95,87,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
            <span className="term-dot-glyph" style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", inset: 0, color: "#6b1f1f", fontSize: 9, fontWeight: 800, lineHeight: 1 }}>×</span>
          </button>
          <span className="term-dot" style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e", border: "1px solid rgba(0,0,0,0.2)", borderTopColor: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <span className="term-dot-glyph" style={{ color: "#6d5200", fontSize: 9, fontWeight: 800, lineHeight: 1 }}>−</span>
          </span>
          <span className="term-dot" style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840", border: "1px solid rgba(0,0,0,0.2)", borderTopColor: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <span className="term-dot-glyph" style={{ color: "#0f5a1e", fontSize: 9, fontWeight: 800, lineHeight: 1 }}>+</span>
          </span>
        </div>
        {/* centered title */}
        <span style={{ ...mono(10.5, "rgba(var(--fg-c),0.72)", { letterSpacing: "0.1em" }), position: "absolute", left: "50%", transform: "translateX(-50%)", userSelect: "none", pointerEvents: "none" }}>hazem@tübingen — zsh</span>
        {/* right spacer */}
        <span style={mono(9.5, "rgba(var(--fg-d),0.6)", { marginLeft: "auto", letterSpacing: "0.14em", fontStyle: "italic", paddingRight: 14, flexShrink: 0 })}>80×24</span>
      </div>

      {/* body */}
      <div className="px-5 py-5 space-y-4" style={{ minHeight: 264 }}>
        <div style={mono(10.5, "var(--fg-d)", { letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: 8 })}>
          <span style={{ color: "var(--c3h)" }}>✓</span>
          <span>hazem-alabiad.ini loaded — 4 roles, {factLocation}</span>
        </div>

        {/* typed command */}
        <div style={mono(13, "var(--fg-hero)", { display: "flex", alignItems: "center", gap: 8, letterSpacing: "0.04em" })}>
          <span style={{ color: "var(--c3h)" }}>➜</span>
          <span style={{ color: "var(--c1h)", fontWeight: 500 }}>~/portfolio</span>
          <span>{cmd}</span>
          <span className="blink" style={{ display: "inline-block", width: 7, height: 14, background: "var(--c1h)", boxShadow: "0 0 8px rgba(var(--c1),0.7)" }} />
        </div>

        {/* roles */}
        <div className="space-y-2.5 pt-1">
          {TERM_ROLES.map((r, i) => (
            <div key={r.t} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span style={mono(11, "var(--fg-d)", { letterSpacing: "0.1em" })}>{String(i + 1).padStart(2, "0")}</span>
              <span style={mono(13, "var(--fg-hero)", { letterSpacing: "0.03em" })}>{r.t}</span>
              {r.p && (
                <span className="blink" style={mono(10, "var(--c3h)", { marginLeft: "auto", letterSpacing: "0.14em" })}>◀ PRIORITY</span>
              )}
            </div>
          ))}
        </div>

        {/* status key/values */}
        <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2" style={{ borderTop: "1px solid rgba(var(--c1),0.1)" }}>
          <div style={mono(11.5, "var(--fg-b)", { letterSpacing: "0.04em", display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 })}>
            <span style={{ color: "var(--c2h)" }}>role</span><span style={{ color: "var(--fg-d)" }}>=</span><span style={{ color: "var(--c3h)" }}>"Student Asst. · LLM AI‑Tutor"</span>
          </div>
          <div style={mono(11.5, "var(--fg-b)", { letterSpacing: "0.04em", display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 })}>
            <span style={{ color: "var(--c2h)" }}>location</span><span style={{ color: "var(--fg-d)" }}>=</span><span style={{ color: "var(--c3h)" }}>"{factLocation}"</span>
          </div>
          <div style={mono(11.5, "var(--fg-b)", { letterSpacing: "0.04em", display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 })}>
            <span style={{ color: "var(--c2h)" }}>open_to</span><span style={{ color: "var(--fg-d)" }}>=</span><span style={{ color: "var(--c1h)" }}>["Working Student","NLP/AI/LLMs"]</span>
          </div>
          <div style={mono(11.5, "var(--fg-b)", { letterSpacing: "0.04em", display: "flex", flexWrap: "wrap", gap: 6, minWidth: 0 })}>
            <span style={{ color: "var(--c2h)" }}>status</span><span style={{ color: "var(--fg-d)" }}>=</span><span style={{ color: "var(--c4h)" }}>"Open to opportunities"</span>
          </div>
        </div>
      </div>

      {/* macOS-style footer bar */}
      <div className="flex items-center justify-between gap-3" style={{ height: 32, borderTop: "1px solid rgba(var(--c1),0.09)", background: "linear-gradient(180deg, rgba(var(--c1),0.02), rgba(0,0,0,0.1))", padding: "0 14px" }}>
        <span className="flex items-center gap-2" style={mono(9, "rgba(var(--fg-c),0.6)", { letterSpacing: "0.12em" })}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#28c840", boxShadow: "0 0 6px rgba(40,200,64,0.6)", display: "inline-block" }} />
          zsh — working
        </span>
        <span style={mono(9, "rgba(var(--fg-d),0.6)", { letterSpacing: "0.12em" })}>UTF-8</span>
      </div>
    </div>
  );
}

const BOOTED_KEY = "hazem_portfolio_booted_v2";

export default function App() {
  const [booted, setBooted] = useState<boolean>(() => {
    try { return localStorage.getItem(BOOTED_KEY) === "1"; } catch { return false; }
  });
  const [scrolled, setScrolled] = useState(false);
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
      {!booted && <BootScreen onDone={() => { setBooted(true); try { localStorage.setItem(BOOTED_KEY, "1"); } catch {} }} />}
      {/* Ambient background drift (pure CSS transforms, barely-there) */}
      <div className="neural-bg" aria-hidden="true" />
      <div className="ambient" style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }} aria-hidden="true">
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
      </div>
      <ScrollProgressBar />
      <SideNavDots />
      {/* deco layers removed: CustomCursor, MouseTrail, CRTOverlay, ParticleField, MuseBloom — rAF + canvas cost, no functional value */}
      <AmbientCursor />

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
            <button onClick={() => scrollTo("contact")} style={mono(9.5, "var(--c1h)", { letterSpacing: "0.22em", padding: "8px 16px", border: "1px solid rgba(var(--c1),0.6)", background: "rgba(var(--c1),0.12)", cursor: "pointer" })}
              className="transition-all duration-300"
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(var(--c1),0.25)"; el.style.boxShadow = "0 0 20px rgba(var(--c1),0.25)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(var(--c1),0.12)"; el.style.boxShadow = "none"; }}>HIRE ME</button>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            {/* Left — identity, role, bio, CTAs */}
            <div className="lg:col-span-7">
              <div className="flex items-center gap-2.5 mb-5" style={{ opacity: 1 }}>
                <span style={mono(11, "var(--c3h)", { letterSpacing: "0.06em" })}>➜</span>
                <span style={mono(11, "var(--c2h)", { letterSpacing: "0.06em" })}>~/hazem-alabiad</span>
                <span className="blink" style={{ display: "inline-block", width: 6, height: 12, background: "var(--c1h)", boxShadow: "0 0 8px rgba(var(--c1),0.7)" }} />
              </div>

              <h1 ref={heroNameRef} className="relative leading-[1.02] tracking-tight mb-4 select-none"
                style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(3.2rem,8.5vw,6.6rem)", letterSpacing: "-0.02em", color: "var(--fg-a)" }}>
                Hazem <span style={{ background: "linear-gradient(135deg, var(--c1h), var(--c2h))", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent" }}>Alabiad</span>
              </h1>

              <p className="mb-2" style={{ ...mono(13, "var(--c1h)", { letterSpacing: "0.12em" }), fontSize: "clamp(12px,1.6vw,16px)" }}>
                FULL-STACK ENGINEER & AI/NLP RESEARCHER · M.A. COMPUTATIONAL LINGUISTICS
              </p>
              <div className="flex items-center gap-2.5 mb-6">
                <span style={mono(9, "var(--c3h)", { padding: "3px 9px", border: "1px solid rgba(var(--c3),0.35)", letterSpacing: "0.2em", background: "rgba(var(--c3),0.06)" })}>NOW</span>
                <span style={mono(11.5, "var(--fg-hero)", { letterSpacing: "0.06em" })}>Student Assistant · LLM AI-Tutor & IWM — Uni Tübingen</span>
              </div>

              <p ref={heroTagRef} {...ep("heroTagline", DEFAULTS.heroTagline, { ...body(17, "var(--fg-hero)"), maxWidth: 600, marginBottom: 24 })}>
                {get("heroTagline", DEFAULTS.heroTagline)}
              </p>

              <div className="flex flex-wrap gap-3.5 mb-4">
                <MagneticWrap>
                  <button onClick={() => scrollTo("experience")} className="flex items-center gap-2.5 transition-all duration-300"
                    style={mono(10, "var(--c1h)", { padding: "14px 28px", border: "1px solid rgba(var(--c1),0.55)", letterSpacing: "0.18em", cursor: "pointer" })}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(var(--c1),0.15)"; el.style.borderColor = "var(--c1h)"; el.style.boxShadow = "0 0 28px rgba(var(--c1),0.28)"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "rgba(var(--c1),0.55)"; el.style.boxShadow = "none"; }}>
                    VIEW EXPERIENCE <ArrowUpRight size={13} />
                  </button>
                </MagneticWrap>
                <MagneticWrap>
                  <button onClick={() => scrollTo("contact")} className="flex items-center gap-2.5 transition-all duration-300"
                    style={mono(10, "var(--c2h)", { padding: "14px 28px", border: "1px solid rgba(var(--c2),0.4)", letterSpacing: "0.18em", cursor: "pointer", color: "var(--c2h)" })}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(var(--c2),0.12)"; el.style.borderColor = "var(--c2h)"; el.style.boxShadow = "0 0 28px rgba(var(--c2),0.25)"; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "rgba(var(--c2),0.4)"; el.style.boxShadow = "none"; }}>
                    CONTACT ME
                  </button>
                </MagneticWrap>
                <CVDownloadButton cvUrl={content.cvDataUrl} />
              </div>

              <div className="flex items-center gap-4" style={{ maxWidth: 600 }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--c3h)", boxShadow: "0 0 8px var(--c3h)" }} />
                <span style={mono(10, "var(--fg-c)", { letterSpacing: "0.16em" })}>OPEN TO WORKING STUDENT & INTERNSHIP ROLES — NLP · AI/ML · LLMS — TÜBINGEN / STUTTGART / REMOTE</span>
              </div>
            </div>

            {/* Right — Photo + Enhanced Terminal */}
            <div className="lg:col-span-5 space-y-5">
              {/* Photo — smaller, professional frame */}
              <div className="group relative cursor-pointer" style={{ filter: "drop-shadow(0 16px 48px rgba(0,0,0,0.35))" }}>
                <div className="console-frame" style={{
                  width: "100%", aspectRatio: "1/1", maxWidth: 240, margin: "0 auto", overflow: "hidden", position: "relative",
                  border: "1px solid rgba(var(--c1),0.18)", background: "var(--card-photo)",
                  borderRadius: 2,
                }}>
                  <div className="br-tl" />
                  <div className="br-br" />
                  <img
                    src={content.photo || hazemPhoto}
                    alt="Hazem Alabiad"
                    loading="lazy"
                    decoding="async"
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 30%", display: "block" }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 55%, rgba(var(--bg-rgb),0.85) 100%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 4px)", opacity: 0.4, pointerEvents: "none" }} />
                  <div className="flex items-center gap-2" style={{ position: "absolute", left: 12, bottom: 10, zIndex: 2 }}>
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--c3h)", boxShadow: "0 0 6px var(--c3h)" }} />
                    <span style={mono(8.5, "var(--fg-a)", { letterSpacing: "0.14em" })}>HAZEM ALABIAD · ONLINE</span>
                  </div>
                </div>
              </div>

              {/* ── Enhanced Terminal ── */}
              <EnhancedTerminal factLocation={get("factLocation", DEFAULT_CONTENT.factLocation)} />
            </div>
          </div>
        </div>
        <div className="flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5" style={{ color: "rgba(var(--c1),0.35)" }}>
          <span style={mono(9, "rgba(var(--c1),0.35)", { letterSpacing: "0.3em" })}>SCROLL</span>
          <ChevronDown size={14} />
        </div>
      </section>

      <ImpactStrip />
      <KeywordMarquee />
      <CurrentFocus />

      {/* ── Experience ── */}
      <section id="experience" className="relative py-20 lg:py-28 px-6" style={{ zIndex: 10 }}>
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

      {/* ── Projects ── */}
      <section id="projects" className="relative py-20 lg:py-28 px-6" style={{ zIndex: 10 }}>
        <div ref={projectsR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="02" label="PROJECTS" />
          <div className="transition-all duration-1000" style={{ opacity: projectsR.visible ? 1 : 0, transform: projectsR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2.1rem,5vw,3.4rem)", color: "var(--fg-a)" }}>
              Research <span style={{ color: "var(--c1h)" }}>& Projects</span>
            </WipeHeading>
            <Spotlight className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {content.projects.map((proj, pidx) => {
                const ProjIcon = [Brain, Code2, Database, GraduationCap, Globe, Briefcase][pidx % 6];
                const projColor = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)"][pidx % 4];
                const projHex = ["var(--c1h)", "var(--c2h)", "var(--c3h)", "var(--c4h)"][pidx % 4];
                const sc: Record<string, string> = { RESEARCH: "var(--c2h)", COMPLETE: "var(--c3h)", ACTIVE: "var(--c1h)", BETA: "var(--c4h)" };
                return (
                  <div key={proj.id || proj.name} className={`transition-all duration-300 ${projectsR.visible ? "slide-up-item" : "opacity-0"}`} style={{ animationDelay: `${pidx * 120}ms` }}>
                  <div className="flex flex-col h-full p-6 pr-7 transition-all duration-300 will-change-transform console-frame"
                    style={{ background: "var(--card)", border: "1px solid rgba(var(--c1),0.08)", transform: "translateY(0)", boxShadow: "none", position: "relative", overflow: "hidden" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.4)"; (e.currentTarget as HTMLElement).style.background = "var(--card-hover)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 18px 40px rgba(0,0,0,0.35), 0 0 24px rgba(var(--c1),0.08)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(var(--c1),0.08)"; (e.currentTarget as HTMLElement).style.background = "var(--card)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                    <div className="br-tl" />
                    <div className="br-br" />
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${projHex}, transparent 70%)`, opacity: 0, transition: "opacity 0.3s ease" }} className="proj-accent" />
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: "0.1em", color: "var(--fg-d)" }}>{String(pidx + 1).padStart(2, "0")}</span>
                      <div className="flex items-center gap-2.5">
                        <span style={mono(9, sc[proj.status] || "var(--c4h)", { padding: "2px 8px", border: "1px solid rgba(var(--c1),0.14)", letterSpacing: "0.18em" })}>{proj.status}</span>
                        <span style={mono(9, "var(--fg-c)")}>{proj.year}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3.5">
                      <span className="flex-shrink-0" style={{ color: projHex }}><ProjIcon size={16} strokeWidth={1.6} /></span>
                      <h3 style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 600, fontSize: 18, color: "var(--fg-a)", letterSpacing: "0.02em" }}>{proj.name}</h3>
                    </div>
                    <p className="mb-5 flex-1" style={{ ...body(14, "var(--fg-b)", { lineHeight: 1.6 }), minHeight: 0 }}>{proj.desc}</p>
                    {proj.impact ? (
                      <div className="mb-5" style={{ ...mono(10, "var(--fg-hero)", { letterSpacing: "0.08em" }), lineHeight: 1.5, padding: "8px 11px", borderLeft: "2px solid rgba(var(--c1),0.6)", background: "rgba(var(--c1),0.05)" }}>
                        <span style={{ color: "var(--c1h)" }}>▎</span> {proj.impact}
                      </div>
                    ) : null}
                    <div className="flex items-end justify-between gap-3">
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tags.slice(0, 5).map((tag) => (
                          <span key={tag} style={mono(9, "var(--fg-c)", { padding: "2px 7px", background: "var(--chip)" })}>{tag}</span>
                        ))}
                      </div>
                      <a href={proj.link} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 transition-opacity flex-shrink-0"
                        style={mono(9, "var(--c1h)", { textDecoration: "none", letterSpacing: "0.14em", opacity: 0.7 })}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}>
                        <Github size={11} /> VIEW ON GITHUB
                      </a>
                    </div>
                  </div>
                  </div>
                );
              })}
            </Spotlight>
          </div>
        </div>
      </section>

      {/* ── Skills ── */}
      <section id="skills" className="relative py-20 lg:py-28 px-6" style={{ zIndex: 10 }}>
        <div ref={skillsR.ref} className="max-w-7xl mx-auto">
          <SectionLabel num="03" label="PROFICIENCIES" />
          <div className="transition-all duration-1000" style={{ opacity: skillsR.visible ? 1 : 0, transform: skillsR.visible ? "translateY(0)" : "translateY(32px)" }}>
            <WipeHeading className="mb-8" style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: "clamp(2.1rem,5vw,3.4rem)", color: "var(--fg-a)" }}>
              Technical <span style={{ color: "var(--c2h)" }}>Proficiencies</span>
            </WipeHeading>
            <Spotlight className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
              <div className="console-frame p-6" style={{ border: "1px solid rgba(var(--c2),0.14)", background: "var(--card)" }}>
                <div style={mono(9, "rgba(var(--c2),0.55)", { marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>AI / NLP / LLM RESEARCH</div>
                <div>
                  {content.skills.filter((s) => s.cat === "ai").map((s, i) => (
                    <SkillListItem key={s.id || s.label} label={s.label} index={i + 1} visible={skillsR.visible} delay={i * 90} accent="var(--c2h)" />
                  ))}
                </div>
              </div>
              <div className="console-frame p-6" style={{ border: "1px solid rgba(var(--c1),0.1)", background: "var(--card)" }}>
                <div style={mono(9, "rgba(var(--c1),0.45)", { marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.3em" })}>FULL_STACK_ENGINEERING</div>
                <div>
                  {content.skills.filter((s) => s.cat === "stack").map((s, i) => (
                    <SkillListItem key={s.id || s.label} label={s.label} index={i + 1} visible={skillsR.visible} delay={i * 90} />
                  ))}
                </div>
              </div>
            </Spotlight>
            <div className="mt-10">
              <div style={mono(9, "rgba(var(--c1),0.5)", { marginBottom: 14, textTransform: "uppercase" as const, letterSpacing: "0.26em" })}>SPOKEN_LANGUAGES</div>
              <div className="flex flex-wrap gap-x-10 gap-y-4">
                {content.languages.map((lang, i) => (
                  <span key={lang.id} className="flex items-baseline gap-2" style={{ opacity: skillsR.visible ? 1 : 0, transform: skillsR.visible ? "translateY(0)" : "translateY(8px)", transition: `opacity 0.6s ease ${i * 60}ms, transform 0.6s ease ${i * 60}ms` }}>
                    <span style={{ fontFamily: '"Rajdhani", sans-serif', fontWeight: 700, fontSize: 18, color: "var(--fg-a)" }}>{lang.name}</span>
                    <span style={mono(9.5, lang.level.toLowerCase() === "native" ? "var(--c1h)" : "var(--fg-c)", { letterSpacing: "0.16em" })}>{lang.level.toUpperCase()}</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-10">
              <div style={mono(9, "rgba(var(--c1),0.5)", { marginBottom: 16, textTransform: "uppercase" as const, letterSpacing: "0.26em" })}>DEVOPS & WORKFLOW</div>
              <div className="flex flex-wrap gap-2">
                {["Docker", "Git", "Jest / Cypress / Puppeteer", "Figma", "MySQL", "Agile / Scrum", "Linux", "CI/CD"].map((t, ti) => (
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
      <section id="contact" className="relative py-20 lg:py-28 px-6" style={{ zIndex: 10 }}>
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
                        <div key={link.id} className={`${base} w-full`} style={{ ...box, borderColor: copiedEmail ? "rgba(var(--c3),0.4)" : "rgba(var(--c1),0.07)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = copiedEmail ? "rgba(var(--c3),0.5)" : "rgba(var(--c1),0.28)")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = copiedEmail ? "rgba(var(--c3),0.4)" : "rgba(var(--c1),0.07)")}>
                          <a href={link.href || `mailto:${link.value}`} className="flex items-center gap-3.5 flex-1 min-w-0" style={{ textDecoration: "none" }}
                            aria-label={`Email ${link.value}`}>
                            <div className="flex items-center justify-center flex-shrink-0" style={{ width: 32, height: 32, border: "1px solid rgba(var(--c1),0.2)", color: "var(--c1h)" }}>
                              <Icon size={13} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div style={mono(9, "var(--fg-c)", { marginBottom: 3, textTransform: "uppercase" as const, letterSpacing: "0.2em" })}>{link.label}</div>
                              <div style={body(16, "var(--fg-a)")}>{link.value}</div>
                            </div>
                          </a>
                          <span className="flex items-center gap-1.5 flex-shrink-0">
                            <button type="button" title="Copy email"
                              onClick={() => { navigator.clipboard.writeText(link.value).catch(() => {}); setCopiedEmail(true); setTimeout(() => setCopiedEmail(false), 2000); }}
                              style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}>
                              <Copy size={13} color="var(--c1h)" style={{ opacity: 0.6 }} />
                            </button>
                            {copiedEmail && (
                              <span style={mono(9, "var(--c3h)", { letterSpacing: "0.15em" })}>COPIED</span>
                            )}
                          </span>
                        </div>
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
        onUnlock={() => { markOwner(); setCmsEnabled(true); setEditorOpen(true); }}
        onAutoUnlock={() => { markOwner(); setCmsEnabled(true); }}
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
