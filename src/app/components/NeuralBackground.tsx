import { useEffect, useRef, useState } from "react";

const TEAL = "45,212,191";
const CYAN = "103,232,249";
const VIOLET = "167,139,250";
const PINK = "244,114,182";

interface Node { x: number; y: number; vx: number; vy: number; r: number }
interface Star { x: number; y: number; r: number; base: number; phase: number; speed: number }
interface Ember { x: number; y: number; vx: number; vy: number; r: number; color: string; phase: number }
interface Shape { x: number; y: number; size: number; rotation: number; rotSpeed: number; type: "hex" | "diamond" | "ring" }
interface Pillar { x: number; drift: number; w: number; phase: number; color: string }
interface Meteor { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cursor, setCursor] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let w = 0, h = 0;
    const NODES = 40;
    const nodes: Node[] = [];
    const cursorTrail: { x: number; y: number; life: number }[] = [];
    const shapes: Shape[] = [];
    const stars: Star[] = [];
    const embers: Ember[] = [];
    const pillars: Pillar[] = [];
    const meteors: Meteor[] = [];
    let nextMeteor = performance.now() + 6000;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", e => { setCursor({ x: e.clientX, y: e.clientY }); });
    window.addEventListener("mouseleave", () => { setCursor({ x: -1000, y: -1000 }); });

    for (let i = 0; i < NODES; i++) {
      nodes.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.6,
      });
    }

    for (let i = 0; i < 10; i++) {
      shapes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 60 + 20,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.005,
        type: ["hex", "diamond", "ring"][i % 3] as "hex" | "diamond" | "ring",
      });
    }

    const starCount = Math.min(120, Math.floor((w * h) / 14000));
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h * 0.75,
        r: Math.random() * 1.3 + 0.3,
        base: Math.random() * 0.4 + 0.15,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.9 + 0.3,
      });
    }

    for (let i = 0; i < 28; i++) {
      embers.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: -(Math.random() * 0.35 + 0.08),
        r: Math.random() * 1.8 + 0.6,
        color: [TEAL, CYAN, VIOLET, PINK][i % 4],
        phase: Math.random() * Math.PI * 2,
      });
    }

    pillars.push(
      { x: w * 0.25, drift: 0.12, w: 90, phase: 0, color: TEAL },
      { x: w * 0.62, drift: -0.09, w: 130, phase: Math.PI, color: VIOLET },
      { x: w * 0.85, drift: 0.07, w: 70, phase: Math.PI * 0.5, color: CYAN },
    );

    function drawHex(cx: number, cy: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    function drawAurora() {
      const t = Date.now() * 0.0004;
      const ribbons = [
        { yBase: h * 0.18, amp: 60, len: h * 0.55, freq: 0.006, phase: 0, color: CYAN, alpha: 0.05 },
        { yBase: h * 0.3, amp: 90, len: h * 0.6, freq: 0.004, phase: 2.1, color: VIOLET, alpha: 0.05 },
        { yBase: h * 0.12, amp: 45, len: h * 0.4, freq: 0.008, phase: 4.2, color: TEAL, alpha: 0.04 },
      ];
      ribbons.forEach((rb, ri) => {
        ctx.save();
        ctx.beginPath();
        for (let x = -40; x <= w + 40; x += 12) {
          const wave = Math.sin(x * rb.freq + t * 1.3 + rb.phase) * rb.amp;
          const wave2 = Math.sin(x * rb.freq * 0.5 - t * 0.8 + rb.phase) * rb.amp * 0.5;
          const y = rb.yBase + wave + wave2;
          x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        for (let x = w + 40; x >= -40; x -= 12) {
          ctx.lineTo(x, rb.yBase + rb.len);
        }
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, rb.yBase, 0, rb.yBase + rb.len);
        grad.addColorStop(0, `rgba(${rb.color},${rb.alpha + ri * 0.005})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = "screen";
        ctx.fill();
        ctx.restore();
      });
    }

    function drawHorizon() {
      const t = Date.now() * 0.001;
      const horizonY = h * 0.86;
      const glowH = 120;
      const glow = ctx.createLinearGradient(0, horizonY - glowH, 0, horizonY);
      glow.addColorStop(0, "rgba(0,0,0,0)");
      glow.addColorStop(1, `rgba(${VIOLET},${0.16 + Math.sin(t * 1.5) * 0.05})`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizonY - glowH, w, glowH);

      ctx.strokeStyle = `rgba(${TEAL},0.05)`;
      ctx.lineWidth = 0.6;
      const steps = 26;
      for (let i = 0; i <= steps; i++) {
        const f = i / steps;
        const y = horizonY + f * (h - horizonY) * 1.15;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(${CYAN},0.045)`;
      ctx.lineWidth = 0.7;
      for (let x = -w; x <= w * 2; x += w / 14) {
        ctx.beginPath();
        ctx.moveTo(w * 0.5, horizonY);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      ctx.strokeStyle = `rgba(${TEAL},${0.4 + Math.sin(t * 1.5) * 0.12})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      ctx.lineTo(w, horizonY);
      ctx.stroke();
    }

    function drawStars() {
      const t = Date.now() * 0.001;
      stars.forEach(s => {
        const tw = 0.5 + 0.5 * Math.sin(t * s.speed + s.phase);
        const a = s.base * (0.35 + 0.65 * tw);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
        if (tw > 0.85) {
          const flare = (tw - 0.85) * 0.35;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${CYAN},${flare})`;
          ctx.fill();
        }
      });
    }

    function drawEmbers() {
      const t = Date.now() * 0.001;
      embers.forEach(e => {
        e.x += e.vx + Math.sin(t + e.phase) * 0.15;
        e.y += e.vy;
        if (e.y < -10) { e.y = h + 10; e.x = Math.random() * w; }
        if (e.x < -10) e.x = w + 10;
        if (e.x > w + 10) e.x = -10;
        const flicker = 0.5 + 0.5 * Math.sin(t * 2 + e.phase);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${e.color},${0.12 + flicker * 0.22})`;
        ctx.fill();
      });
    }

    function drawPillars() {
      const t = Date.now() * 0.0002;
      pillars.forEach(p => {
        const x = p.x + Math.sin(t * p.drift * 3 + p.phase) * w * 0.06;
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.001 + p.phase);
        const grad = ctx.createLinearGradient(x - p.w / 2, 0, x + p.w / 2, 0);
        grad.addColorStop(0, "rgba(0,0,0,0)");
        grad.addColorStop(0.5, `rgba(${p.color},${0.03 + pulse * 0.05})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(x - p.w / 2, 0, p.w, h);
      });
    }

    function drawMeteors() {
      if (performance.now() > nextMeteor && meteors.length < 2) {
        const fromLeft = Math.random() > 0.5;
        meteors.push({
          x: fromLeft ? Math.random() * w * 0.4 : w * (0.6 + Math.random() * 0.4),
          y: Math.random() * h * 0.25,
          vx: (fromLeft ? 1 : -1) * (Math.random() * 3 + 2.5),
          vy: Math.random() * 1.5 + 1.5,
          life: 1,
          maxLife: Math.random() * 30 + 20,
        });
        nextMeteor = performance.now() + Math.random() * 7000 + 6000;
      }
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.01;
        if (m.life <= 0) { meteors.splice(i, 1); continue; }
        const tailX = m.x - m.vx * 14;
        const tailY = m.y - m.vy * 14;
        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${0.8 * m.life})`);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // ambient base glow
      const base = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.35, Math.max(w, h) * 0.8);
      base.addColorStop(0, "rgba(16,16,34,1)");
      base.addColorStop(1, "rgba(5,5,12,1)");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      // gradient mesh blobs (breathing)
      const t = Date.now() * 0.0003;
      const breathe = 0.85 + 0.15 * Math.sin(Date.now() * 0.0006);
      const blobs = [
        { x: w * 0.3 + Math.sin(t) * 100, y: h * 0.3 + Math.cos(t * 0.7) * 80, r: 300 * breathe, c: TEAL, a: 0.06 },
        { x: w * 0.7 + Math.cos(t * 0.8) * 120, y: h * 0.5 + Math.sin(t * 0.5) * 100, r: 350 * breathe, c: VIOLET, a: 0.055 },
        { x: w * 0.5 + Math.sin(t * 1.2) * 80, y: h * 0.7 + Math.cos(t * 0.9) * 90, r: 280 * breathe, c: CYAN, a: 0.045 },
        { x: w * 0.2 + Math.cos(t * 0.6) * 60, y: h * 0.8 + Math.sin(t) * 70, r: 250 * breathe, c: PINK, a: 0.035 },
      ];
      blobs.forEach(b => {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(${b.c},${b.a})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      drawPillars();
      drawAurora();
      drawHorizon();
      drawStars();
      drawEmbers();

      // cursor trail
      cursorTrail.push({ x: cursor.x, y: cursor.y, life: 1 });
      if (cursorTrail.length > 40) cursorTrail.shift();
      for (let i = cursorTrail.length - 1; i >= 0; i--) {
        const tr = cursorTrail[i];
        tr.life -= 0.025;
        if (tr.life <= 0) { cursorTrail.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, 3 * tr.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${TEAL},${tr.life * 0.3})`;
        ctx.fill();
      }

      // floating geometric shapes
      shapes.forEach(s => {
        s.rotation += s.rotSpeed;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.strokeStyle = `rgba(${TEAL},0.07)`;
        ctx.lineWidth = 1;
        if (s.type === "hex") {
          drawHex(0, 0, s.size);
          ctx.stroke();
        } else if (s.type === "diamond") {
          ctx.beginPath();
          ctx.moveTo(0, -s.size);
          ctx.lineTo(s.size * 0.6, 0);
          ctx.lineTo(0, s.size);
          ctx.lineTo(-s.size * 0.6, 0);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, s.size, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      // grid
      ctx.strokeStyle = `rgba(${TEAL},0.018)`;
      ctx.lineWidth = 0.5;
      const GRID = 96;
      for (let x = 0; x < w; x += GRID) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += GRID) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      // connections
      for (let i = 0; i < NODES; i++) {
        for (let j = i + 1; j < NODES; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.18;
            ctx.strokeStyle = `rgba(${CYAN},${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // cursor influence on nodes
      nodes.forEach(n => {
        const dx = n.x - cursor.x;
        const dy = n.y - cursor.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200 && dist > 0) {
          const force = (1 - dist / 200) * 0.02;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
        n.vx *= 0.99;
        n.vy *= 0.99;

        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 7);
        grad.addColorStop(0, `rgba(${TEAL},0.16)`);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 7, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${TEAL},0.55)`;
        ctx.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });

      drawMeteors();

      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.8 }} />
    </>
  );
}
