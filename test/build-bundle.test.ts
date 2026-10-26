import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupFixtures, makeImage, makeSiteRepo } from "./ingest-fixtures";

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
  cleanupFixtures();
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

// ---------------------------------------------------------------------------
// Staged-ingest additions (v4.1.0): the manifest output, the exact legacy body
// size, and manifest-key collisions. Design: presby
// docs/work-log/2026-10-26-site-ingest-size.md, Phase 3 (KB-1 .. KB-7).
// Every image below is synthetic generated bytes.
// ---------------------------------------------------------------------------

interface ManifestImage {
  manifestKey: string;
  contentType: string;
  sha256: string;
  size: number;
  file: string;
  relativePath: string;
}
const manifestModule = (await import("../scripts/build-bundle.mjs")) as unknown as {
  buildManifest: (repoRoot: string) => {
    pages: { path: string; frontMatter: Record<string, unknown>; mdxAst: unknown }[];
    images: ManifestImage[];
  };
  buildBundle: (repoRoot: string) => { bundle: { images: unknown[] } };
  legacyBodyBytes: (
    pages: unknown[],
    images: { manifestKey: string; contentType: string; size: number }[],
  ) => number;
  legacyBundleFromManifest: (manifest: { pages: unknown[]; images: ManifestImage[] }) => unknown;
  BuildError: new (...args: never[]) => Error & { code: string };
};
const { buildManifest, legacyBodyBytes, legacyBundleFromManifest, BuildError } = manifestModule;

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

describe("build-bundle.mjs — buildManifest()", () => {
  it("KB-1: hashes, sizes and types every image, sorted by manifest key, with no base64", () => {
    const b = makeImage("png", 300, 1);
    const a = makeImage("jpeg", 200, 2);
    const c = makeImage("webp", 100, 3);
    const repo = makeSiteRepo({ images: { "b.png": b, "a.jpg": a, "c.webp": c } });
    const manifest = buildManifest(repo);

    expect(manifest.pages.map((p) => p.path)).toEqual(["/"]);
    expect(manifest.images.map((i) => i.manifestKey)).toEqual(["a", "b", "c"]);
    expect(manifest.images.map((i) => i.contentType)).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(manifest.images.map((i) => i.size)).toEqual([200, 300, 100]);
    expect(manifest.images.map((i) => i.sha256)).toEqual([sha(a), sha(b), sha(c)]);
    for (const image of manifest.images) {
      expect(image).not.toHaveProperty("bytesBase64");
      expect(existsSync(image.file)).toBe(true);
    }
    expect(manifest.images[0].relativePath).toBe("images/a.jpg");
  });

  it("KB-3: ignores non-image files and matches extensions case-insensitively", () => {
    const repo = makeSiteRepo({
      images: { "Hero.PNG": makeImage("png", 64, 4), "notes.txt": Buffer.from("not an image") },
    });
    const manifest = buildManifest(repo);
    // The extension is recognized whatever its case. The key keeps the same
    // behaviour as before v4.1.0 (path.basename strips only the lower-cased
    // extension, so an upper-case one stays in the key); changing keys would
    // silently break content that already references them.
    expect(manifest.images.map((i) => i.manifestKey)).toEqual(["Hero.PNG"]);
    expect(manifest.images[0].contentType).toBe("image/png");
  });

  it("KB-4: an empty image file and a file that is not an image are errors that name the file", () => {
    const empty = makeSiteRepo({ images: { "blank.png": Buffer.alloc(0) } });
    expect(() => buildManifest(empty)).toThrowError(
      'Image "images/blank.png" is empty. Remove it or replace it, then push again.',
    );
    const wrong = makeSiteRepo({ images: { "fake.jpg": Buffer.from("plain text pretending to be a photo") } });
    let caught: unknown;
    try {
      buildManifest(wrong);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(BuildError);
    expect((caught as { code: string }).code).toBe("image_not_image");
    expect((caught as Error).message).toBe(
      'Image "images/fake.jpg" is not a PNG, JPEG or WEBP file, whatever its name says. Replace or remove it, then push again.',
    );
  });

  it("KB-7: two files with identical bytes are two entries sharing one hash", () => {
    const bytes = makeImage("png", 128, 9);
    const repo = makeSiteRepo({ images: { "one.png": bytes, "two.png": bytes } });
    const manifest = buildManifest(repo);
    expect(manifest.images.map((i) => i.manifestKey)).toEqual(["one", "two"]);
    expect(manifest.images[0].sha256).toBe(manifest.images[1].sha256);
  });
});

describe("build-bundle.mjs — manifest-key collisions (R8)", () => {
  const collisionText = (a: string, b: string, key: string) =>
    `Images "${a}" and "${b}" would both be called "${key}". Give each image a different file name (the part before the extension), then push again.`;

  it("KB-2: a.jpg and a.png both fail, naming both paths, in buildManifest and buildBundle", () => {
    const repo = makeSiteRepo({
      images: { "a.png": makeImage("png", 64, 1), "a.jpg": makeImage("jpeg", 64, 2) },
    });
    expect(() => buildManifest(repo)).toThrowError(collisionText("images/a.jpg", "images/a.png", "a"));
    expect(() => buildBundle(repo)).toThrowError(collisionText("images/a.jpg", "images/a.png", "a"));
  });

  it("KB-2: the same base name in two folders collides too", () => {
    const repo = makeSiteRepo({
      images: { "x/shot.png": makeImage("png", 64, 1), "y/shot.png": makeImage("png", 64, 2) },
    });
    expect(() => buildManifest(repo)).toThrowError(collisionText("images/x/shot.png", "images/y/shot.png", "shot"));
    expect(() => buildBundle(repo)).toThrowError(collisionText("images/x/shot.png", "images/y/shot.png", "shot"));
  });

  it("KB-2: the collision error carries a stable code", () => {
    const repo = makeSiteRepo({
      images: { "a.png": makeImage("png", 64, 1), "a.webp": makeImage("webp", 64, 2) },
    });
    try {
      buildManifest(repo);
      throw new Error("expected a collision");
    } catch (err) {
      expect(err).toBeInstanceOf(BuildError);
      expect((err as { code: string }).code).toBe("key_collision");
    }
  });
});

describe("build-bundle.mjs — legacyBodyBytes()", () => {
  it("KB-5: equals the byte length of the serialized legacy body, exactly", () => {
    const repo = makeSiteRepo({
      images: {
        // Every base64 padding case (size mod 3 = 0, 1, 2) and a key that needs JSON escaping.
        "pad0.png": makeImage("png", 9, 1),
        "pad1.png": makeImage("png", 10, 2),
        "pad2.png": makeImage("png", 11, 3),
        'quo"te.png': makeImage("png", 40, 4),
        "caf\u00e9 \u2603.webp": makeImage("webp", 55, 5),
      },
      pages: { "about.json": { frontMatter: { title: "Caf\u00e9" }, blocks: [] } },
    });
    const manifest = buildManifest(repo);
    const expected = Buffer.byteLength(JSON.stringify(legacyBundleFromManifest(manifest)));
    expect(legacyBodyBytes(manifest.pages, manifest.images)).toBe(expected);
    // And it equals what the unchanged legacy builder serializes.
    expect(expected).toBe(Buffer.byteLength(JSON.stringify(buildBundle(repo))));
  });

  it("KB-5: a site with no images is still exact", () => {
    const manifest = buildManifest(makeSiteRepo());
    expect(legacyBodyBytes(manifest.pages, manifest.images)).toBe(
      Buffer.byteLength(JSON.stringify(legacyBundleFromManifest(manifest))),
    );
  });
});

describe("build-bundle.mjs — CLI", () => {
  const script = path.resolve(process.cwd(), "scripts/build-bundle.mjs");

  it("KB-6: the default output is still the legacy bundle", () => {
    const repo = makeSiteRepo({ images: { "a.png": makeImage("png", 64, 1) } });
    const out = path.join(repo, "bundle.json");
    const run = spawnSync(process.execPath, [script, repo, out], { encoding: "utf-8" });
    expect(run.status).toBe(0);
    expect(JSON.parse(readFileSync(out, "utf-8"))).toEqual(buildBundle(repo));
  });

  it("KB-6: --manifest writes the manifest instead", () => {
    const repo = makeSiteRepo({ images: { "a.png": makeImage("png", 64, 1) } });
    const out = path.join(repo, "manifest.json");
    const run = spawnSync(process.execPath, [script, repo, out, "--manifest"], { encoding: "utf-8" });
    expect(run.status).toBe(0);
    const written = JSON.parse(readFileSync(out, "utf-8"));
    expect(written.images).toHaveLength(1);
    expect(written.images[0]).toMatchObject({ manifestKey: "a", contentType: "image/png", size: 64 });
    expect(written.images[0]).not.toHaveProperty("bytesBase64");
    expect(written.pages).toHaveLength(1);
  });

  it("KB-6: a collision exits non-zero with the readable line", () => {
    const repo = makeSiteRepo({
      images: { "a.png": makeImage("png", 64, 1), "a.jpg": makeImage("jpeg", 64, 2) },
    });
    const run = spawnSync(process.execPath, [script, repo, path.join(repo, "o.json")], { encoding: "utf-8" });
    expect(run.status).not.toBe(0);
    expect(run.stderr).toContain('would both be called "a"');
  });
});
