// Minimal link unfurl — fetches a page's Open Graph data client-side via a
// CORS proxy (no API key). Returns title, description, thumbnail, and site.

export interface LinkMeta {
  url: string;
  title: string;
  description: string;
  image: string;
  site: string;
}

const PROXY = "https://api.codetabs.com/v1/proxy?quest=";

function metaContent(doc: Document, selectors: string[]): string {
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const c = el.getAttribute("content");
      if (c && c.trim()) return c.trim();
    }
  }
  return "";
}

export async function unfurl(rawUrl: string): Promise<LinkMeta> {
  const url = /^https?:\/\//.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const res = await fetch(`${PROXY}${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`Could not fetch ${url}`);
  const html = await res.text();
  const doc = new DOMParser().parseFromString(html, "text/html");
  const title =
    metaContent(doc, ['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
    (doc.querySelector("title")?.textContent || "").trim() ||
    url;
  const image = metaContent(doc, ['meta[property="og:image"]', 'meta[property="og:image:url"]', 'meta[name="twitter:image"]']);
  const description = metaContent(doc, ['meta[property="og:description"]', 'meta[name="description"]']);
  let site = metaContent(doc, ['meta[property="og:site_name"]']);
  if (!site) {
    try { site = new URL(url).hostname.replace(/^www\./, ""); } catch { site = url; }
  }
  return { url, title, description, image, site };
}
