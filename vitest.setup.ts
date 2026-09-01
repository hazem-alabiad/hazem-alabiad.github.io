import { afterEach } from "vitest";
import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement IntersectionObserver or MutationObserver properly
// as constructors. Stub both globally so any component that uses them can mount.
if (!globalThis.IntersectionObserver) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    constructor(_cb: IntersectionObserverCallback, _opts?: IntersectionObserverInit) {}
  }
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

// jsdom doesn't implement smooth scrolling; make scrollIntoView a safe no-op
// so components that scroll to anchors on interaction don't throw.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  // keep tests independent: fresh storage + clean DOM bodies
  try { window.localStorage.clear(); window.sessionStorage.clear(); } catch { /* noop */ }
  document.getElementsByTagName("body")[0]?.replaceChildren();
});
