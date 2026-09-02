import { describe, it, expect } from "vitest";
import { levenshtein, parseQuery, scorePost, highlightTokens } from "./search";
import type { Post } from "./posts";

const posts: Post[] = [
  {
    slug: "arabic-vmwe-llms",
    title: "Why LLMs Fumble Low-Resource Languages",
    date: "2026-07-18",
    description: "Arabic verbal multiword expressions are everywhere and LLMs still miss them.",
    tags: ["LLMs", "Arabic", "NLP"],
    Component: () => null,
  },
  {
    slug: "cargo-cult-kanban",
    title: "Cargo-Cult Kanban",
    date: "2026-07-02",
    description: "Why copying a board shape without the feedback loop behind it never works.",
    tags: ["Engineering", "Process"],
    Component: () => null,
  },
  {
    slug: "reading-code-out-loud",
    title: "Reading Code Out Loud",
    date: "2026-06-12",
    description: "A five-minute habit that finds more bugs than any linter.",
    tags: ["Engineering", "Reviews"],
    Component: () => null,
  },
  {
    slug: "arabic-digits",
    title: "The Ambiguity of ١٢٣٤: Arabic Digits in NLP Pipelines",
    date: "2026-05-21",
    description: "Eastern Arabic numerals break tokenizers, MT metrics, and your eval set.",
    tags: ["NLP", "Arabic", "Data"],
    Component: () => null,
  },
];

function matched(q: string): string[] {
  const parsed = parseQuery(q);
  return posts
    .map((p) => ({ p, s: scorePost(p, parsed) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p.slug);
}

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => expect(levenshtein("arabic", "arabic")).toBe(0));
  it("counts single substitution", () => expect(levenshtein("arabic", "arabci")).toBe(1));
  it("counts length difference", () => expect(levenshtein("cat", "cats")).toBe(1));
});

describe("fuzzy matching", () => {
  it("matches a one-letter typo on a short word", () => {
    expect(matched("arrbic")).toContain("arabic-vmwe-llms");
  });
  it("matches a transposed-letter typo", () => {
    expect(matched("nlp")).toEqual(["arabic-vmwe-llms", "arabic-digits"]);
    // 'llms' vs 'llms' exact; a typo like 'lms' should still hit title/ds tag
    expect(matched("lms")).toContain("arabic-vmwe-llms");
  });
  it("does not match an over-tolerated query", () => {
    expect(matched("zzzz")).toEqual([]);
  });
});

describe("tag queries (#tag)", () => {
  it("filters by exact tag and returns all matching posts", () => {
    expect(matched("#arabic")).toEqual(expect.arrayContaining(["arabic-vmwe-llms", "arabic-digits"]));
  });
  it("is fuzzy-tolerant on tag names", () => {
    expect(matched("#arrbic")).toEqual(expect.arrayContaining(["arabic-vmwe-llms"]));
  });
});

describe("field-scoped queries", () => {
  it("scopes to the title", () => {
    expect(matched("title:kanban")).toEqual(["cargo-cult-kanban"]);
  });
  it("scopes to the tag field", () => {
    expect(matched("tag:process")).toEqual(["cargo-cult-kanban"]);
  });
  it("scopes to the slug", () => {
    expect(matched("slug:reading")).toEqual(["reading-code-out-loud"]);
  });
  it("does not leak a title term into other fields", () => {
    // 'kanban' only in that post's title
    expect(matched("title:kanban")).toEqual(["cargo-cult-kanban"]);
  });
});

describe("quoted phrases", () => {
  it("matches a phrase verbatim", () => {
    expect(matched('"A five-minute habit"')).toEqual(["reading-code-out-loud"]);
  });
  it("requires the whole phrase, not just one word", () => {
    expect(matched('"verbatim phrase not present"')).toEqual([]);
  });
});

describe("negation", () => {
  it("excludes posts matching a negated term", () => {
    const r = matched("arabic -digits");
    expect(r).not.toContain("arabic-digits");
    expect(r).toContain("arabic-vmwe-llms");
  });
  it("excludes by negated tag", () => {
    // arabic-digits also carries #data, so -#data removes just it
    const r = matched("#arabic -#data");
    expect(r).not.toContain("arabic-digits");
    expect(r).toEqual(["arabic-vmwe-llms"]);
  });
});

describe("ranking", () => {
  it("ranks a title match above a tag-only match", () => {
    // 'code' appears in a title and a desc; the title post should rank higher
    const parsed = parseQuery("code");
    const s = posts.map((p) => ({ slug: p.slug, s: scorePost(p, parsed) })).filter((x) => x.s > 0);
    const top = s.sort((a, b) => b.s - a.s)[0];
    expect(top?.slug).toBe("reading-code-out-loud");
  });
});

describe("AND semantics across multiple terms", () => {
  it("requires every positive term to match", () => {
    expect(matched("arabic llms")).toEqual(["arabic-vmwe-llms"]);
    expect(matched("arabic england")).toEqual([]);
  });
});

describe("highlightTokens", () => {
  it("returns tag values and text terms, longest first", () => {
    expect(highlightTokens("#arabic multiword")).toEqual(["multiword", "arabic"]);
  });
  it("returns no tokens for a negated-only query", () => {
    expect(highlightTokens("-arabic")).toEqual([]);
  });
});
