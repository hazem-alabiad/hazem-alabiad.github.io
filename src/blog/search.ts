// Fuzzy + operator-aware blog search. No dependencies, pure functions.
//
// Grammar (tokens split on whitespace, quotes group a phrase):
//   #tag           -> filter by tag (fuzzy-tolerant on the tag name)
//   title:foo      -> scope to the title field (also desc|tag|tags|slug|topic|all)
//   "exact phrase" -> phrase must appear verbatim (case-insensitive) anywhere
//   -term          -> NEGATE: a post matching term is excluded
//   bare word      -> fuzzy-matched (edit-distance tolerant) across all fields
// Positive terms are AND'd: every one must match for a post to be returned.
// Ranking = sum of per-term match strength; title/substring matches weigh higher.
import type { Post } from "./posts";

const FIELDS = new Set(["title", "tag", "tags", "desc", "description", "slug", "topic", "all"]);
const FIELDMAP: Record<string, string> = { description: "desc" };

export type TermKind = "tag" | "field" | "phrase" | "text";

export interface Term {
  kind: TermKind;
  value: string; // lowercased
  field?: string;
}

export interface ParsedQuery {
  positive: Term[];
  negative: Term[];
}

/** Damerau-Levenshtein edit distance (adjacent transposition costs 1). */
export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (a === b) return 0;
  if (!m) return n;
  if (!n) return m;
  const d: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[m][n];
}

/** Max edit distance worth tolerating for a token of this length. */
function tol(len: number): number {
  if (len <= 3) return 0;
  if (len <= 6) return 1;
  return 2;
}

function tokenize(input: string): { neg: boolean; value: string }[] {
  const out: { neg: boolean; value: string }[] = [];
  const re = /(-?)(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    const neg = m[1] === "-";
    const value = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    if (!value) continue;
    out.push({ neg, value });
  }
  return out;
}

function toTerm(value: string): Term {
  const lower = value.toLowerCase();
  if (lower.startsWith("#")) return { kind: "tag", value: lower.slice(1) };
  const idx = lower.indexOf(":");
  if (idx > 0) {
    const f = FIELDMAP[lower.slice(0, idx)] ?? lower.slice(0, idx);
    if (FIELDS.has(f)) return { kind: "field", field: f, value: lower.slice(idx + 1) };
  }
  if (lower.includes(" ")) return { kind: "phrase", value: lower };
  return { kind: "text", value: lower };
}

export function parseQuery(input: string): ParsedQuery {
  const positive: Term[] = [];
  const negative: Term[] = [];
  for (const { neg, value } of tokenize(input)) {
    (neg ? negative : positive).push(toTerm(value));
  }
  return { positive, negative };
}

function fieldText(p: Post, field: string): string {
  switch (field) {
    case "title":
      return p.title.toLowerCase();
    case "desc":
    case "description":
      return p.description.toLowerCase();
    case "slug":
      return p.slug.toLowerCase();
    case "tag":
    case "tags":
      return p.tags.map((t) => t.toLowerCase()).join(" ");
    case "topic":
    case "all":
    default:
      return (p.title + " " + p.description + " " + p.slug + " " + p.tags.join(" ")).toLowerCase();
  }
}

/** Score a token against a candidate string; 0 = no match. Higher = stronger. */
function tokenScore(value: string, text: string): number {
  const v = value.toLowerCase();
  if (!v) return 0;
  if (text.includes(v)) return 10;
  const t = tol(v.length);
  if (!t) return 0;
  if (levenshtein(v, text) <= t) return 6;
  const words = text.split(/[^a-z0-9\u0600-\u06FF]+/).filter(Boolean);
  let best = 0;
  for (const w of words) {
    const d = levenshtein(v, w);
    if (d <= t) best = Math.max(best, 6 - d);
  }
  return best;
}

function matchTerm(term: Term, p: Post): number {
  const v = term.value;
  if (!v) return 0;
  if (term.kind === "tag") {
    const tags = p.tags.map((t) => t.toLowerCase());
    let best = 0;
    for (const t of tags) {
      if (t.includes(v)) return 10;
      const d = levenshtein(v, t);
      if (tol(v.length) && d <= tol(v.length)) best = Math.max(best, 6 - d);
    }
    return best;
  }
  if (term.kind === "field") return tokenScore(v, fieldText(p, term.field!));
  if (term.kind === "phrase") {
    const text = (p.title + " " + p.description + " " + p.slug + " " + p.tags.join(" ")).toLowerCase();
    return text.includes(v) ? 12 : 0;
  }
  // bare text: best score across every field
  let best = 0;
  for (const f of ["title", "desc", "slug", "tags"]) {
    const s = tokenScore(v, fieldText(p, f));
    if (s > best) best = s;
  }
  return best;
}

/** Rank a post for a parsed query. 0 means it does not match (excluded). */
export function scorePost(p: Post, parsed: ParsedQuery): number {
  if (!parsed.positive.length && !parsed.negative.length) return 0;
  let total = 0;
  for (const term of parsed.positive) {
    const s = matchTerm(term, p);
    if (s === 0) return 0; // AND: every positive term must match
    total += s;
  }
  for (const term of parsed.negative) {
    if (matchTerm(term, p) > 0) return 0; // any negative match excludes the post
  }
  return total;
}

/** Values worth highlighting in rendered title/desc/tag text, longest first. */
export function highlightTokens(input: string): string[] {
  const { positive } = parseQuery(input);
  const vals = positive.map((t) => t.value).filter(Boolean);
  return [...new Set(vals)].sort((a, b) => b.length - a.length);
}
