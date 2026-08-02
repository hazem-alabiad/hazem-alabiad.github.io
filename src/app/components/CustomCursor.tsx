import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let raf = 0;

    function onMove(e: PointerEvent) {
      mx = e.clientX;
      my = e.clientY;
      if (!visible) { visible = true; dot.style.opacity = "1"; ring.style.opacity = "1"; }
    }
    function onLeave() {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    }
    function onOver(e: PointerEvent) {
      const t = e.target as HTMLElement;
      const interactive = t.closest("a, button, [data-cursor-hover], input, textarea, select, [role='button']");
      targetScale = interactive ? 2.2 : 1;
    }
    function onDown() { targetScale = 0.8; }
    function onUp() { targetScale = 1; }

    function tick() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      scale += (targetScale - scale) * 0.12;

      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(tick);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="custom-cursor-ring" />
      <div ref={dotRef} className="custom-cursor-dot" />
      <style>{`
        .custom-cursor-ring {
          position: fixed; top: 0; left: 0; z-index: 99999;
          width: 34px; height: 34px; border-radius: 50%;
          border: 1.5px solid rgba(94,234,212,0.7);
          box-shadow: 0 0 18px rgba(45,212,191,0.25), inset 0 0 8px rgba(45,212,191,0.12);
          pointer-events: none; opacity: 0;
          transition: opacity 0.3s ease;
        }
        .custom-cursor-dot {
          position: fixed; top: 0; left: 0; z-index: 99999;
          width: 5px; height: 5px; border-radius: 50%;
          background: #5eead4;
          box-shadow: 0 0 8px rgba(94,234,212,0.9), 0 0 16px rgba(45,212,191,0.5);
          pointer-events: none; opacity: 0;
          transition: opacity 0.3s ease;
        }
        @media (hover: none), (pointer: coarse) {
          .custom-cursor-ring, .custom-cursor-dot { display: none; }
        }
      `}</style>
    </>
  );
}
