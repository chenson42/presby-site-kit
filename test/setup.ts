// Runs after every test — unmounts whatever the previous test rendered into
// jsdom's shared `document`. Without this, a test file with several `render()`
// calls accumulates DOM across tests (e.g. two <h1>s where a test expects
// one), which is a false failure, not a real one.
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

/**
 * jsdom has no real `matchMedia` — `Gallery` (the one non-`Nav` client
 * component, see README v3.4.0) calls it to honor
 * `prefers-reduced-motion`. A no-motion-preference default here means any
 * test file exercising `Gallery` indirectly (e.g. through
 * `BLOCK_REGISTRY.gallery`) doesn't crash just for not caring about that
 * behavior specifically — `test/components/Gallery.test.tsx` overrides
 * this locally per-test to exercise the reduced-motion path itself.
 */
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
