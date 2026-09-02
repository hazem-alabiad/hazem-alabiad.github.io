/**
 * Date formatting for the blog.
 *
 * Public dates render relative (dev.to style: "2 days ago"), with the
 * absolute date in the tooltip and the canonical ISO value in the
 * `<time datetime>` attribute for SEO / schema consumers.
 */

export function absDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Compact relative label: today / yesterday / N days / N weeks / N months / N years ago. */
export function relDate(iso: string, now: Date = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const ms = now.getTime() - d.getTime();
  if (ms < 0) return absDate(iso);
  const day = 86_400_000;
  const days = Math.floor(ms / day);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `${w} week${w === 1 ? "" : "s"} ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "last year" : `${years} years ago`;
}
