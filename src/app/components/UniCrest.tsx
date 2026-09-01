export function UniCrest({ school, size = 44 }: { school: string; size?: number }) {
  const s = school.toLowerCase().includes("tübingen")
    ? { bg: "#7CC4A8", fg: "#131015", glyph: "T" }
    : { bg: "#0E4C92", fg: "#F2EEE6", glyph: school.charAt(0) };
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="edu-crest">
      <rect x="1" y="1" width="46" height="46" rx="12" fill={s.bg} />
      <rect x="1" y="1" width="46" height="46" rx="12" fill="none" stroke="var(--rule-soft)" />
      <path d="M24 11l11 5v7h-.4c0 4.9-4 8.6-10.6 8.6S13.4 27.9 13.4 23H13v-7l11-5z" fill="none" stroke={s.fg} strokeWidth="2" strokeLinejoin="round" />
      <path d="M16.5 30.5L20 21h8l3.5 9.5" fill="none" stroke={s.fg} strokeWidth="2" strokeLinejoin="round" />
      <text x="24" y="38" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="600" fontSize="14" fill={s.fg}>{s.glyph}</text>
    </svg>
  );
}
