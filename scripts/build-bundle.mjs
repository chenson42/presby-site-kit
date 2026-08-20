#!/usr/bin/env node
// build-bundle.mjs — turns a content repo's `content/` + `images/` directories
// into the JSON shape presby's `POST /api/sites/ingest` expects
// (src/app/api/sites/ingest/route.ts's `validateBundle()`, presby's own repo).
//
// This is the single place that shape is produced — a content repo's CI never
// hand-rolls it, so the two never drift independently. Deliberately dependency
// -free (no gray-matter/js-yaml): this v0.0.1-stub reusable workflow only ever
// reads `frontMatter.title` on the render side (see src/index.tsx), so a
// minimal flat `key: value` frontmatter parser is enough. A v1.0.0+ release
// that adds real MDX parsing gets a real YAML parser then, not before.
//
// Convention:
//   content/index.mdx        -> page path "/"
//   content/<name>.mdx        -> page path "/<name>"
//   content/<a>/<b>.mdx        -> page path "/<a>/<b>"
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

function walkFiles(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full));
    else out.push(full);
  }
  return out;
}

/** Splits a leading `---\n...\n---` YAML-ish block from an .mdx file's body.
 * Only flat `key: value` pairs are parsed — enough for `title`/`description`,
 * everything else is opaque and carried into `frontMatter` verbatim as a
 * string. Quoted values have their surrounding quotes stripped. */
function parseFrontMatter(raw) {
  if (!raw.startsWith("---\n") && !raw.startsWith("---\r\n")) {
    return { frontMatter: {}, body: raw };
  }
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return { frontMatter: {}, body: raw };
  const block = raw.slice(raw.indexOf("\n") + 1, end);
  const rest = raw.slice(end + 4).replace(/^\r?\n/, "");
  const frontMatter = {};
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    let value = trimmed.slice(colon + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontMatter[key] = value;
  }
  return { frontMatter, body: rest };
}

function pagePathFor(contentRoot, file) {
  const rel = path
    .relative(contentRoot, file)
    .replace(/\.mdx?$/, "")
    .split(path.sep)
    .join("/");
  if (rel === "index") return "/";
  return `/${rel.replace(/\/index$/, "")}`;
}

function buildPages(contentRoot) {
  const files = walkFiles(contentRoot).filter((f) => /\.mdx?$/.test(f));
  if (files.length === 0) {
    throw new Error(
      `No .mdx/.md files found under ${contentRoot} — a site needs at least a content/index.mdx.`,
    );
  }
  return files.map((file) => {
    const raw = readFileSync(file, "utf-8");
    const { frontMatter, body } = parseFrontMatter(raw);
    return {
      path: pagePathFor(contentRoot, file),
      frontMatter,
      // Opaque to the v0.0.1-stub render path (src/index.tsx never reads
      // this) — carried as the raw MDX body so a later real-parsing release
      // has something to parse without a second ingest-side change.
      mdxAst: { raw: body },
    };
  });
}

function buildImages(imagesRoot) {
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

function main() {
  const [, , repoRoot, outFile] = process.argv;
  if (!repoRoot || !outFile) {
    console.error(
      "usage: node build-bundle.mjs <content-repo-root> <output-file>",
    );
    process.exit(1);
  }
  const contentRoot = path.join(repoRoot, "content");
  const imagesRoot = path.join(repoRoot, "images");

  const pages = buildPages(contentRoot);
  const images = buildImages(imagesRoot);

  const bundle = { bundle: { schemaVersion: 1, pages, images } };
  writeFileSync(outFile, JSON.stringify(bundle));
  console.log(
    `Built bundle: ${pages.length} page(s), ${images.length} image(s) -> ${outFile}`,
  );
}

main();
