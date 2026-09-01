import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { 
      window.removeEventListener("scroll", onScroll); 
      window.removeEventListener("resize", onScroll); 
    };
  }, []);
  return (
    <div className="progress-track" aria-hidden="true">
      <div className="progress-bar" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
