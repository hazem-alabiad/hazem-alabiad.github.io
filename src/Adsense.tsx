import { useEffect } from "react";

// AdSense publisher ID (verified meta tag in index.html too).
export const ADSENSE_CLIENT = "ca-pub-7133788538271959";

// Master switch: keep false until you're ready to serve ads AND review is complete.
// Flip to true once real slot IDs are set and AdSense approves the site.
export const ADSENSE_ENABLED = false;

declare global {
  interface Window { adsbygoogle?: unknown[] }
}

export function AdUnit({ slot, className = "" }: { slot: string; className?: string }) {
  useEffect(() => {
    if (!ADSENSE_ENABLED) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch { /* ads unavailable */ }
  }, []);
  if (!ADSENSE_ENABLED) return null;
  return (
    <div className={`ad-slot ${className}`}>
      <span className="ad-label" aria-hidden="true">Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}