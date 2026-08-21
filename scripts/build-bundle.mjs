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
// Usage: node scripts/build-bundle.mjs <content-repo-root> <output-file>

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const CONTENT_TYPE_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

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
  });
}

export function buildImages(imagesRoot) {
  const files = walkFiles(imagesRoot);
  return files
    .map((file) => {
      const ext = path.extname(file).toLowerCase();
      const contentType = CONTENT_TYPE_BY_EXT[ext];
      if (!contentType) return null;
      const manifestKey = path.basename(file, ext);
      const bytes = readFileSync(file);
      return {
        manifestKey,
        contentType,
        bytesBase64: bytes.toString("base64"),
      };
    })
    .filter((image) => image !== null);
}

export function buildBundle(repoRoot) {
  const contentRoot = path.join(repoRoot, "content");
  const imagesRoot = path.join(repoRoot, "images");
  const pages = buildPages(contentRoot);
  const images = buildImages(imagesRoot);
  return { bundle: { schemaVersion: 1, pages, images } };
}

function main() {
  const [, , repoRoot, outFile] = process.argv;
  if (!repoRoot || !outFile) {
    console.error(
      "usage: node build-bundle.mjs <content-repo-root> <output-file>",
    );
    process.exit(1);
  }
  const bundle = buildBundle(repoRoot);
  writeFileSync(outFile, JSON.stringify(bundle));
  console.log(
    `Built bundle: ${bundle.bundle.pages.length} page(s), ${bundle.bundle.images.length} image(s) -> ${outFile}`,
  );
}

// CLI guard — mirrors `require.main === module` for ESM, so tests can
// `import { buildBundle, buildPages, ... }` from this file without
// triggering `main()`'s `process.argv`/`process.exit` side effects.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main();
}
