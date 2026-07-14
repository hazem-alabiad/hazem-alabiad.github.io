export interface CvLinkFields {
  cvFileData?: string;
  cvUrl?: string;
  cvFileName?: string;
}

export function resolveCvHref(hero: CvLinkFields, fallback: string) {
  return hero.cvFileData || hero.cvUrl || fallback;
}

export function resolveCvName(hero: CvLinkFields, fallback: string) {
  return hero.cvFileName || (hero.cvUrl ? "resume.pdf" : fallback);
}
