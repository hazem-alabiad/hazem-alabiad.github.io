type CvOverrides = {
  cvDataUrl?: string;
  cvUrl?: string;
  cvFileData?: unknown;
  cvFileName?: string;
};

// Resolve the href for the bundled CV, preferring a CMS-provided override.
export function resolveCvHref(content: CvOverrides, bundledHref: string): string {
  return content.cvDataUrl || content.cvUrl || bundledHref;
}

// Resolve the download name for the CV, preferring a CMS-provided override.
export function resolveCvName(content: CvOverrides, fallbackName: string): string {
  return content.cvFileName || fallbackName;
}
