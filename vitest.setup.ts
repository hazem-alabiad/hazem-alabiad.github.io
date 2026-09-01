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
