import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

// build-bundle.mjs is plain, dependency-free JS (not compiled by tsc — see
// tsconfig.json's `include`), so it's imported dynamically here rather than
// given a hand-authored ambient module declaration just for the test.
const buildBundleModule = (await import("../scripts/build-bundle.mjs")) as {
  buildBundle: (repoRoot: string) => {
    bundle: {
      schemaVersion: number;
      pages: { path: string; frontMatter: Record<string, unknown>; mdxAst: unknown }[];
      images: { manifestKey: string; contentType: string; bytesBase64: string }[];
    };
  };
  pagePathFor: (contentRoot: string, file: string) => string;
};

const { buildBundle, pagePathFor } = buildBundleModule;

const dirsToClean: string[] = [];

function makeFixtureRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "site-kit-fixture-"));
  dirsToClean.push(root);
  mkdirSync(path.join(root, "content", "staff"), { recursive: true });
  mkdirSync(path.join(root, "images"), { recursive: true });

  writeFileSync(
    path.join(root, "content", "index.json"),
    JSON.stringify({
      frontMatter: { title: "Home" },
      blocks: [
        { type: "hero", props: { heading: "Join us Sunday", image: "hero-banner" } },
      ],
    }),
  );
  writeFileSync(
    path.join(root, "content", "about.json"),
    JSON.stringify({
      frontMatter: { title: "About" },
      blocks: [{ type: "prose", props: { body: "Founded 1962." } }],
    }),
  );
  writeFileSync(
    path.join(root, "content", "staff", "leadership.json"),
    JSON.stringify({ frontMatter: {}, blocks: [] }),
  );

  // A 1x1 transparent PNG — synthetic bytes, not a real photograph.
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  writeFileSync(path.join(root, "images", "hero-banner.png"), onePixelPng);
  writeFileSync(path.join(root, "images", "notes.txt"), "not an image, should be ignored");

  return root;
}

afterEach(() => {
  while (dirsToClean.length > 0) {
    const dir = dirsToClean.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("build-bundle.mjs — buildBundle()", () => {
  it("produces the bundle shape presby's ingest route expects", () => {
    const repo = makeFixtureRepo();
    const result = buildBundle(repo);

    expect(result.bundle.schemaVersion).toBe(1);
    expect(result.bundle.pages).toHaveLength(3);
    expect(result.bundle.images).toHaveLength(1);

    const paths = result.bundle.pages.map((p) => p.path).sort();
    expect(paths).toEqual(["/", "/about", "/staff/leadership"]);

    const home = result.bundle.pages.find((p) => p.path === "/");
    expect(home?.frontMatter).toEqual({ title: "Home" });
    expect(home?.mdxAst).toEqual({
      blocks: [{ type: "hero", props: { heading: "Join us Sunday", image: "hero-banner" } }],
    });

    const image = result.bundle.images[0];
    expect(image.manifestKey).toBe("hero-banner");
    expect(image.contentType).toBe("image/png");
    expect(typeof image.bytesBase64).toBe("string");
    expect(image.bytesBase64.length).toBeGreaterThan(0);
  });

  it("REGRESSION: the root page (\"/\") always sorts first in bundle.pages, regardless of filename", () => {
    // site-kit's Nav renders pages in bundle order — "about.json" sorts
    // alphabetically before "index.json", which without this ordering
    // would put "Home" somewhere in the middle of the nav instead of first.
    const repo = makeFixtureRepo();
    const result = buildBundle(repo);
    expect(result.bundle.pages[0]?.path).toBe("/");
    // Every other page keeps its natural alphabetical order after that.
    expect(result.bundle.pages.map((p) => p.path)).toEqual([
      "/",
      "/about",
      "/staff/leadership",
    ]);
  });

  it("ignores non-image files under images/", () => {
    const repo = makeFixtureRepo();
    const result = buildBundle(repo);
    expect(result.bundle.images.some((i) => i.manifestKey === "notes")).toBe(false);
  });

  it("throws a file-naming error for malformed JSON rather than silently dropping the page", () => {
    const repo = makeFixtureRepo();
    writeFileSync(path.join(repo, "content", "broken.json"), "{ not valid json");
    expect(() => buildBundle(repo)).toThrowError(/broken\.json/);
  });

  it("throws when a content repo has no content/ files at all", () => {
    const root = mkdtempSync(path.join(tmpdir(), "site-kit-empty-"));
    dirsToClean.push(root);
    mkdirSync(path.join(root, "content"), { recursive: true });
    expect(() => buildBundle(root)).toThrowError(/No \.json files/);
  });
});

describe("build-bundle.mjs — pagePathFor()", () => {
  it("maps index.json to the root path and nested files to slash-joined paths", () => {
    const contentRoot = "/repo/content";
    expect(pagePathFor(contentRoot, "/repo/content/index.json")).toBe("/");
    expect(pagePathFor(contentRoot, "/repo/content/about.json")).toBe("/about");
    expect(pagePathFor(contentRoot, "/repo/content/staff/leadership.json")).toBe(
      "/staff/leadership",
    );
  });
});
