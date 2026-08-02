import { useEffect, useRef } from "react";

export default function GlitchOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef({ scan: "0,0,0", bar: 0.03 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    let w = 0, h = 0;

    function applyTheme() {
      const dark = document.documentElement.classList.contains("dark")
        || (!document.documentElement.classList.contains("light") && window.matchMedia("(prefers-color-scheme: dark)").matches);
      themeRef.current = dark ? { scan: "0,0,0", bar: 0.03 } : { scan: "90,90,120", bar: 0.015 };
    }
    applyTheme();
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function rand(min: number, max: number) { return Math.random() * (max - min) + min; }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Random glitch bars
      if (Math.random() < 0.03) {
        const y = rand(0, h);
        const h2 = rand(2, 8);
        const shift = rand(-30, 30);
        ctx.drawImage(canvas, 0, y, w, h2, shift, y, w, h2);
        ctx.fillStyle = `rgba(45,212,191,${rand(0.03, 0.08)})`;
        ctx.fillRect(0, y, w, h2);
      }

      // RGB split flash
      if (Math.random() < 0.005) {
        const y = rand(0, h);
        const h2 = rand(1, 4);
        ctx.fillStyle = `rgba(255,0,0,${rand(0.02, 0.06)})`;
        ctx.fillRect(0, y, w, h2);
        ctx.fillStyle = `rgba(0,255,255,${rand(0.02, 0.06)})`;
        ctx.fillRect(rand(-5, 5), y, w, h2);
      }

      // Scanline
      const { scan, bar } = themeRef.current;
      ctx.fillStyle = `rgba(${scan},0.03)`;
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      // Rare full-frame chromatic aberration flash (2050 datastream feel)
      if (Math.random() < 0.002) {
        const f = rand(0.5, 1);
        ctx.drawImage(canvas, -2, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(45,212,191,${0.05 * f})`;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = `rgba(167,139,250,${0.04 * f})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      }

      animId = requestAnimationFrame(draw);
    }
    draw();
    let paused = false;
    function onVisibility() {
      if (document.hidden) {
        paused = true;
        cancelAnimationFrame(animId);
      } else if (paused) {
        paused = false;
        animId = requestAnimationFrame(draw);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.5 }}
    />
  );
}
