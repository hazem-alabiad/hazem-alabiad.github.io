// Lightweight, dependency-free analytics.
// - Local: per-post and per-page view counts, persisted in localStorage.
// - Pluggable: if ANALYTICS_ENDPOINT is set, fires a fire-and-forget beacon
//   so you can drop in GoatCounter, Umami, or your own collector later.

const VIEWS_KEY = "hazem_blog_views";
const ANALYTICS_ENDPOINT = ""; // e.g. "https://yourapp.goatcounter.com/count"

export type ViewsMap = Record<string, number>;

export function readViews(): ViewsMap {
  try {
    return JSON.parse(localStorage.getItem(VIEWS_KEY) || "{}") as ViewsMap;
  } catch {
    return {};
  }
}

export function trackView(key: string): ViewsMap {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const isDev = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  const ownerSkipped = typeof localStorage !== "undefined" && localStorage.getItem("hazem_owner") === "1";
  if (isDev || ownerSkipped) return readViews();
  const sessionCounted = typeof sessionStorage !== "undefined" && sessionStorage.getItem("hazem_blog_session") === "1";
  const views = readViews();
  if (!sessionCounted) {
    views[key] = (views[key] || 0) + 1;
    try { sessionStorage.setItem("hazem_blog_session", "1"); } catch { /* ignore */ }
    try { localStorage.setItem(VIEWS_KEY, JSON.stringify(views)); } catch { /* ignore */ }
  }
  if (ANALYTICS_ENDPOINT) {
    try {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, new URLSearchParams({ p: key }));
    } catch { /* ignore */ }
  }
  return views;
}

export function totalViews(views: ViewsMap): number {
  return Object.values(views).reduce((a, b) => a + (b || 0), 0);
}