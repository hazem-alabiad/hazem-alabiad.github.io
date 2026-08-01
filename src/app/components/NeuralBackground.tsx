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
    const shapes: { x: number; y: number; size: number; rotation: number; rotSpeed: number; type: "hex" | "diamond" | "ring" }[] = [];

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

    for (let i = 0; i < 12; i++) {
      shapes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 60 + 20,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.005,
        type: ["hex", "diamond", "ring"][i % 3] as "hex" | "diamond" | "ring",
      });
    }

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

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // gradient mesh blobs
      const t = Date.now() * 0.0003;
      const blobs = [
        { x: w * 0.3 + Math.sin(t) * 100, y: h * 0.3 + Math.cos(t * 0.7) * 80, r: 300, c: TEAL, a: 0.04 },
        { x: w * 0.7 + Math.cos(t * 0.8) * 120, y: h * 0.5 + Math.sin(t * 0.5) * 100, r: 350, c: VIOLET, a: 0.035 },
        { x: w * 0.5 + Math.sin(t * 1.2) * 80, y: h * 0.7 + Math.cos(t * 0.9) * 90, r: 280, c: CYAN, a: 0.03 },
        { x: w * 0.2 + Math.cos(t * 0.6) * 60, y: h * 0.8 + Math.sin(t) * 70, r: 250, c: PINK, a: 0.025 },
      ];
      blobs.forEach(b => {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        grad.addColorStop(0, `rgba(${b.c},${b.a})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      // cursor trail
      cursorTrail.push({ x: cursor.x, y: cursor.y, life: 1 });
      if (cursorTrail.length > 40) cursorTrail.shift();
      for (let i = cursorTrail.length - 1; i >= 0; i--) {
        const tr = cursorTrail[i];
        tr.life -= 0.025;
        if (tr.life <= 0) { cursorTrail.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, 3 * tr.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${TEAL},${tr.life * 0.25})`;
        ctx.fill();
      }

      // floating geometric shapes
      shapes.forEach(s => {
        s.rotation += s.rotSpeed;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.strokeStyle = `rgba(${TEAL},0.06)`;
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
      ctx.strokeStyle = `rgba(${TEAL},0.015)`;
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
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.7 }} />
    </>
  );
}
