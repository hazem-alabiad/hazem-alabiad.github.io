export default function HudOverlay({ isDark = true }: { isDark?: boolean }) {
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
          opacity: ${isDark ? 0.8 : 0.5}; filter: drop-shadow(0 0 10px rgba(45,212,191,0.9));
        }
        .hud-corner-tl { top: 14px; left: 14px; border-top: 2px solid rgba(45,212,191,0.9); border-left: 2px solid rgba(45,212,191,0.9); }
        .hud-corner-tr { top: 14px; right: 14px; border-top: 2px solid rgba(45,212,191,0.9); border-right: 2px solid rgba(45,212,191,0.9); }
        .hud-corner-bl { bottom: 14px; left: 14px; border-bottom: 2px solid rgba(45,212,191,0.9); border-left: 2px solid rgba(45,212,191,0.9); }
        .hud-corner-br { bottom: 14px; right: 14px; border-bottom: 2px solid rgba(45,212,191,0.9); border-right: 2px solid rgba(45,212,191,0.9); }

        .hud-scanline {
          position: fixed; left: 0; right: 0; height: 2px; z-index: 40; pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(94,234,212,0.7), transparent);
          filter: drop-shadow(0 0 10px rgba(45,212,191,0.8));
          animation: hudScan 6s linear infinite;
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
          border: 1.5px dashed rgba(94,234,212,0.8); border-radius: 50%;
          filter: drop-shadow(0 0 8px rgba(45,212,191,0.7));
          animation: hudReticle 6s linear infinite;
        }
        .hud-reticle::before, .hud-reticle::after {
          content: ""; position: absolute; top: 50%; left: 50%; background: rgba(94,234,212,0.9);
          transform: translate(-50%, -50%);
        }
        .hud-reticle::before { width: 9px; height: 2px; }
        .hud-reticle::after { width: 2px; height: 9px; }
        @keyframes hudReticle {
          0% { transform: rotate(0deg) scale(1); opacity: 0.85; }
          50% { transform: rotate(180deg) scale(1.2); opacity: 1; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.85; }
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
