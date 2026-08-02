import { useEffect, useState } from "react";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function useUptime() {
  const [uptime, setUptime] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const t = setInterval(() => setUptime((performance.now() - t0) / 1000), 1000);
    return () => clearInterval(t);
  }, []);
  return uptime;
}

export default function HudOverlay({ isDark = true }: { isDark?: boolean }) {
  const now = useClock();
  const uptime = useUptime();

  const utc = now.toISOString().slice(11, 19);
  const date = now.toISOString().slice(0, 10).replace(/-/g, ".");
  const hh = String(Math.floor(uptime / 3600)).padStart(2, "0");
  const mm = String(Math.floor((uptime % 3600) / 60)).padStart(2, "0");
  const ss = String(Math.floor(uptime % 60)).padStart(2, "0");
  const ms = String(Math.floor((uptime % 1) * 100)).padStart(2, "0");

  return (
    <>
      <div className="hud-ticker" role="status" aria-label="System status">
        <span className="hud-led" />
        <span className="hud-item">SYS.ONLINE</span>
        <span className="hud-divider" />
        <span className="hud-item hud-dim">UPTIME {hh}:{mm}:{ss}.{ms}</span>
        <span className="hud-divider" />
        <span className="hud-item hud-dim">UTC {utc} — {date}</span>
      </div>
      <div className="hud-reticle" />
      <style>{`
        .hud-ticker {
          position: fixed; left: 50%; transform: translateX(-50%);
          bottom: 12px; z-index: 40; pointer-events: none;
          display: flex; align-items: center; gap: 12px;
          padding: 6px 16px; border-radius: 999px;
          background: ${isDark ? "rgba(8,8,14,0.6)" : "rgba(244,245,251,0.6)"};
          border: 1px solid ${isDark ? "rgba(45,212,191,0.25)" : "rgba(13,148,136,0.25)"};
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 0 18px ${isDark ? "rgba(45,212,191,0.12)" : "rgba(13,148,136,0.1)"};
          font-family: var(--mono, ui-monospace, SFMono-Regular, Menlo, monospace);
          font-size: 11px; letter-spacing: 0.14em;
          color: ${isDark ? "rgba(148,163,184,0.9)" : "rgba(71,85,105,0.9)"};
        }
        .hud-led {
          width: 7px; height: 7px; border-radius: 50%;
          background: #2dd4bf; flex-shrink: 0;
          box-shadow: 0 0 8px rgba(45,212,191,0.9), 0 0 16px rgba(45,212,191,0.5);
          animation: hudLedPulse 2s ease-in-out infinite;
        }
        .hud-item { white-space: nowrap; }
        .hud-item.hud-dim { opacity: 0.75; }
        .hud-divider {
          width: 1px; height: 12px; background: ${isDark ? "rgba(45,212,191,0.3)" : "rgba(13,148,136,0.3)"};
          opacity: 0.6;
        }
        @keyframes hudLedPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.55; transform: scale(0.82); }
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
          .hud-reticle { display: none; }
          .hud-ticker { bottom: 8px; font-size: 9.5px; gap: 8px; padding: 5px 12px; }
          .hud-item.hud-dim { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hud-reticle, .hud-led { animation: none; }
        }
      `}</style>
    </>
  );
}
