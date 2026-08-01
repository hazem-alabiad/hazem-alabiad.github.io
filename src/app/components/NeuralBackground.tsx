import { useEffect, useRef, useState } from "react";

const TEAL = "45,212,191";
const CYAN = "103,232,249";
const VIOLET = "167,139,250";
const PINK = "244,114,182";

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
    const NODES = 48;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number }[] = [];
    const cursorTrail: { x: number; y: number; life: number }[] = [];

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

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // cursor trail
      cursorTrail.push({ x: cursor.x, y: cursor.y, life: 1 });
      if (cursorTrail.length > 30) cursorTrail.shift();
      for (let i = cursorTrail.length - 1; i >= 0; i--) {
        const t = cursorTrail[i];
        t.life -= 0.03;
        if (t.life <= 0) { cursorTrail.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2 * t.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${TEAL},${t.life * 0.3})`;
        ctx.fill();
      }

      // grid
      ctx.strokeStyle = `rgba(${TEAL},0.02)`;
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
            const alpha = (1 - dist / 200) * 0.16;
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
        grad.addColorStop(0, `rgba(${TEAL},0.14)`);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 7, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${TEAL},0.5)`;
        ctx.fill();
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", () => {});
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.65 }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-18%", left: "-8%", width: 640, height: 640, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${TEAL},0.07) 0%, transparent 70%)`, animation: "blobPulse 9s ease-in-out infinite" }} />
        <div style={{ position: "absolute", top: "30%", right: "-12%", width: 560, height: 560, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${VIOLET},0.06) 0%, transparent 70%)`, animation: "blobPulse 11s ease-in-out infinite 2s" }} />
        <div style={{ position: "absolute", bottom: "-10%", left: "24%", width: 520, height: 520, borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${CYAN},0.05) 0%, transparent 70%)`, animation: "blobPulse 13s ease-in-out infinite 4s" }} />
      </div>
    </>
  );
}
