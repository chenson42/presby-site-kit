#!/usr/bin/env node
// build-bundle.mjs — turns a content repo's `content/` + `images/` directories
// into the JSON shape presby's `POST /api/sites/ingest` expects
// (src/app/api/sites/ingest/route.ts's `validateBundle()`, presby's own repo).
//
// This is the single place that shape is produced — a content repo's CI never
// hand-rolls it, so the two never drift independently.
//
// v1.0.0: content files are plain JSON (`content/<name>.json`), each shaped
// `{ "frontMatter": {...}, "blocks": [{ "type": "...", "props": {...} }] }`.
// This replaces the v0.0.1-stub's hand-rolled flat `key: value` frontmatter
// parser, which could only represent flat pairs — v1's typed content-block
// array (see src/index.tsx and DESIGN-v1-components.md for why blocks
// replace real MDX) is inherently nested, and a nested shape needs a real
// parser. Adding a YAML dependency to keep hand-authored frontmatter would
// cut against this package's own "small, auditable, zero runtime deps"
// ethos for a format `JSON.parse` already handles unambiguously and
// dependency-free. Path derivation from filename is unchanged from the
// v0.0.1-stub convention.
//
// Convention:
//   content/index.json        -> page path "/"
//   content/<name>.json       -> page path "/<name>"
//   content/<a>/<b>.json      -> page path "/<a>/<b>"
//   images/<manifestKey>.<png|jpg|jpeg|webp>
//
// Usage: node scripts/build-bundle.mjs <content-repo-root> <output-file> [--manifest]
//
// v4.1.0 (staged ingest, presby DECISION-279): the default output above is
// still the legacy single-request body and is unchanged. `--manifest` writes
// the manifest instead -- the pages plus, for each image, its manifestKey,
// content type, sha256 and byte size (no base64) -- which scripts/ingest.mjs
// uses to send a large site image by image. Two image files that would share
// a manifestKey (a.jpg and a.png, or the same name in two folders) fail the
// build in BOTH forms; before v4.1.0 one silently overwrote the other.

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const CONTENT_TYPE_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/**
 * A problem with the content repo itself (as opposed to a bug in this
 * script). `code` is stable so callers can tell them apart; `message` is
 * written for the person who has to fix their files and has no trailing
 * "Nothing was sent." -- the caller adds that when it is true.
 */
export class BuildError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BuildError";
    this.code = code;
  }
}

/**
 * Magic-byte sniff for the three formats the platform accepts. Mirrors
 * presby's src/lib/storage/sniff.ts (same signatures) so a file that passes
 * here is not refused there for its type. Returns null for anything else.
 */
export function sniffImageType(bytes) {
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function walkFiles(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

export function pagePathFor(contentRoot, file) {
  const rel = path
    .relative(contentRoot, file)
    .replace(/\.json$/, "")
    .split(path.sep)
    .join("/");
  if (rel === "index") return "/";
  return `/${rel.replace(/\/index$/, "")}`;
}

export function buildPages(contentRoot) {
  const files = walkFiles(contentRoot).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    throw new Error(
      `No .json files found under ${contentRoot} — a site needs at least a content/index.json.`,
    );
  }
  return files.map((file) => {
    const raw = readFileSync(file, "utf-8");
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Malformed JSON in ${file}: ${err.message}`);
    }
    const frontMatter =
      parsed && typeof parsed.frontMatter === "object" && parsed.frontMatter !== null
        ? parsed.frontMatter
        : {};
    const blocks = Array.isArray(parsed?.blocks) ? parsed.blocks : [];
    return {
      path: pagePathFor(contentRoot, file),
      frontMatter,
      mdxAst: { blocks },
    };
  }).sort((a, b) => {
    // The root page ("/") always sorts first, regardless of filename --
    // site-kit's Nav renders pages in bundle order, and a home page
    // filed under "index.json" would otherwise sort alphabetically after
    // "about.json" and every other page whose filename starts earlier in
    // the alphabet, putting "Home" somewhere in the middle of the nav.
    // Every other page keeps its natural path order.
    if (a.path === "/") return -1;
    if (b.path === "/") return 1;
    return a.path.localeCompare(b.path);
  });
}

/**
 * Every recognized image under `imagesRoot`, sorted by relative path, with
 * its manifest key. Throws BuildError("key_collision") when two files would
 * share a key. `relativeTo` is what the reported paths are relative to
 * (default: the folder above `imagesRoot`, i.e. the content repo root).
 */
function collectImageFiles(imagesRoot, relativeTo = path.dirname(imagesRoot)) {
  const found = [];
  for (const file of walkFiles(imagesRoot)) {
    const ext = path.extname(file).toLowerCase();
    const contentType = CONTENT_TYPE_BY_EXT[ext];
    if (!contentType) continue;
    found.push({
      file,
      relativePath: path.relative(relativeTo, file).split(path.sep).join("/"),
      contentType,
      manifestKey: path.basename(file, ext),
    });
  }
  found.sort((a, b) =>
    a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0,
  );
  const seen = new Map();
  for (const image of found) {
    const earlier = seen.get(image.manifestKey);
    if (earlier) {
      throw new BuildError(
        "key_collision",
        `Images "${earlier}" and "${image.relativePath}" would both be called "${image.manifestKey}". Give each image a different file name (the part before the extension), then push again.`,
      );
    }
    seen.set(image.manifestKey, image.relativePath);
  }
  return found;
}

export function buildImages(imagesRoot, relativeTo) {
  return collectImageFiles(imagesRoot, relativeTo).map((image) => ({
    manifestKey: image.manifestKey,
    contentType: image.contentType,
    bytesBase64: readFileSync(image.file).toString("base64"),
  }));
}

/**
 * The manifest: the pages plus one entry per image carrying everything the
 * staged transport needs and none of the bytes. Sorted by manifestKey
 * (code-unit order), which is also the order images are uploaded in. `file`
 * is absolute; `relativePath` is what messages show. `contentType` is the
 * SNIFFED type -- an image whose name and bytes disagree on format is sent as
 * what its bytes are, as the platform will treat it; one whose bytes are none
 * of the three formats is a BuildError, not something to send and see refused.
 */
export function buildManifest(repoRoot) {
  const contentRoot = path.join(repoRoot, "content");
  const imagesRoot = path.join(repoRoot, "images");
  const pages = buildPages(contentRoot);
  const images = collectImageFiles(imagesRoot, repoRoot).map((entry) => {
    const bytes = readFileSync(entry.file);
    if (bytes.length === 0) {
      throw new BuildError(
        "image_empty",
        `Image "${entry.relativePath}" is empty. Remove it or replace it, then push again.`,
      );
    }
    const sniffed = sniffImageType(bytes);
    if (!sniffed) {
      throw new BuildError(
        "image_not_image",
        `Image "${entry.relativePath}" is not a PNG, JPEG or WEBP file, whatever its name says. Replace or remove it, then push again.`,
      );
    }
    return {
      manifestKey: entry.manifestKey,
      contentType: sniffed,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      size: bytes.length,
      file: path.resolve(entry.file),
      relativePath: entry.relativePath,
    };
  });
  images.sort((a, b) => (a.manifestKey < b.manifestKey ? -1 : a.manifestKey > b.manifestKey ? 1 : 0));
  return { pages, images };
}

/** The legacy request body for a manifest: reads each image's bytes from disk. */
export function legacyBundleFromManifest(manifest) {
  return {
    bundle: {
      schemaVersion: 1,
      pages: manifest.pages,
      images: manifest.images.map((image) => ({
        manifestKey: image.manifestKey,
        contentType: image.contentType,
        bytesBase64: readFileSync(image.file).toString("base64"),
      })),
    },
  };
}

/**
 * The exact byte length of JSON.stringify(legacyBundleFromManifest(...)),
 * computed WITHOUT building the (tens of MB) base64 string. Images need only
 * `{ manifestKey, contentType, size }`. Exact, not an estimate: the transport
 * choice and the 4,000,000-byte limit are decided on it.
 */
export function legacyBodyBytes(pages, images) {
  let total = Buffer.byteLength(
    JSON.stringify({ bundle: { schemaVersion: 1, pages, images: [] } }),
  );
  images.forEach((image, index) => {
    // The object with an empty base64 string, plus the base64 characters
    // (4 per started 3 bytes), plus the comma between array elements.
    total +=
      Buffer.byteLength(
        JSON.stringify({
          manifestKey: image.manifestKey,
          contentType: image.contentType,
          bytesBase64: "",
        }),
      ) +
      4 * Math.ceil(image.size / 3) +
      (index > 0 ? 1 : 0);
  });
  return total;
}

export function buildBundle(repoRoot) {
  const contentRoot = path.join(repoRoot, "content");
  const imagesRoot = path.join(repoRoot, "images");
  const pages = buildPages(contentRoot);
  const images = buildImages(imagesRoot, repoRoot);
  return { bundle: { schemaVersion: 1, pages, images } };
}

function main() {
  const args = process.argv.slice(2);
  const manifestMode = args.includes("--manifest");
  const [repoRoot, outFile] = args.filter((arg) => !arg.startsWith("--"));
  if (!repoRoot || !outFile) {
    console.error(
      "usage: node build-bundle.mjs <content-repo-root> <output-file> [--manifest]",
    );
    process.exit(1);
  }
  try {
    if (manifestMode) {
      const { pages, images } = buildManifest(repoRoot);
      writeFileSync(outFile, JSON.stringify({ schemaVersion: 1, pages, images }));
      console.log(
        `Built manifest: ${pages.length} page(s), ${images.length} image(s) -> ${outFile}`,
      );
      return;
    }
    const bundle = buildBundle(repoRoot);
    writeFileSync(outFile, JSON.stringify(bundle));
    console.log(
      `Built bundle: ${bundle.bundle.pages.length} page(s), ${bundle.bundle.images.length} image(s) -> ${outFile}`,
    );
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

// CLI guard — mirrors `require.main === module` for ESM, so tests can
// `import { buildBundle, buildPages, ... }` from this file without
// triggering `main()`'s `process.argv`/`process.exit` side effects.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
