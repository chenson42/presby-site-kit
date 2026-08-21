import { defineConfig } from "vitest/config";

/**
 * Every test in this package renders a React component — this package's
 * entire surface area IS the component library — so, unlike presby's own
 * vitest.config.ts (which defaults to "node" and opts individual specs
 * into jsdom), this package defaults straight to jsdom.
 *
 * JSX transform comes from tsconfig.json's `"jsx": "react-jsx"` (Vite's
 * esbuild pipeline reads it directly); no esbuild override needed here.
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    setupFiles: ["./test/setup.ts"],
  },
});
