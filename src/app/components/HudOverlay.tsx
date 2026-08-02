export default function HudOverlay() {
  return (
    <>
      <div className="hud-corner hud-corner-tl" />
      <div className="hud-corner hud-corner-tr" />
      <div className="hud-corner hud-corner-bl" />
      <div className="hud-corner hud-corner-br" />
      <div className="hud-scanline" />
      <div className="hud-reticle" />
      <style>{`
        .hud-corner {
          position: fixed; width: 34px; height: 34px; z-index: 40; pointer-events: none;
          opacity: 0.45; filter: drop-shadow(0 0 6px rgba(45,212,191,0.5));
        }
        .hud-corner-tl { top: 14px; left: 14px; border-top: 1.5px solid rgba(45,212,191,0.7); border-left: 1.5px solid rgba(45,212,191,0.7); }
        .hud-corner-tr { top: 14px; right: 14px; border-top: 1.5px solid rgba(45,212,191,0.7); border-right: 1.5px solid rgba(45,212,191,0.7); }
        .hud-corner-bl { bottom: 14px; left: 14px; border-bottom: 1.5px solid rgba(45,212,191,0.7); border-left: 1.5px solid rgba(45,212,191,0.7); }
        .hud-corner-br { bottom: 14px; right: 14px; border-bottom: 1.5px solid rgba(45,212,191,0.7); border-right: 1.5px solid rgba(45,212,191,0.7); }

        .hud-scanline {
          position: fixed; left: 0; right: 0; height: 1px; z-index: 40; pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(94,234,212,0.35), transparent);
          filter: drop-shadow(0 0 6px rgba(45,212,191,0.4));
          animation: hudScan 9s linear infinite;
        }
        @keyframes hudScan {
          0% { top: 0; opacity: 0; }
          6% { opacity: 1; }
          50% { top: 100%; }
          94% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }

        .hud-reticle {
          position: fixed; right: 34px; bottom: 34px; width: 46px; height: 46px; z-index: 40; pointer-events: none;
          border: 1px dashed rgba(94,234,212,0.4); border-radius: 50%;
          animation: hudReticle 6s linear infinite;
        }
        .hud-reticle::before, .hud-reticle::after {
          content: ""; position: absolute; top: 50%; left: 50%; background: rgba(94,234,212,0.6);
          transform: translate(-50%, -50%);
        }
        .hud-reticle::before { width: 7px; height: 1.5px; }
        .hud-reticle::after { width: 1.5px; height: 7px; }
        @keyframes hudReticle {
          0% { transform: rotate(0deg) scale(1); opacity: 0.7; }
          50% { transform: rotate(180deg) scale(1.15); opacity: 1; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.7; }
        }

        @media (max-width: 768px) {
          .hud-corner, .hud-reticle { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hud-scanline, .hud-reticle { animation: none; }
        }
      `}</style>
    </>
  );
}
