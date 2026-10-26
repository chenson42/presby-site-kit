// Shared fixtures for the ingest tests. Everything here is SYNTHETIC: a valid
// magic-byte header followed by deterministic pseudo-random filler. This
// package is public; no real photograph or church content belongs in it.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export type ImageKind = "png" | "jpeg" | "webp";

const HEADERS: Record<ImageKind, Buffer> = {
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  jpeg: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  webp: Buffer.concat([Buffer.from("RIFF"), Buffer.alloc(4), Buffer.from("WEBP")]),
};

/** `size` bytes: the format's magic header, then xorshift filler seeded by `seed`. */
export function makeImage(kind: ImageKind, size: number, seed: number): Buffer {
  const header = HEADERS[kind];
  if (size < header.length) throw new Error(`size ${size} is below the ${kind} header`);
  const out = Buffer.alloc(size);
  header.copy(out);
  let x = (Math.imul(seed + 1, 2654435761) >>> 0) || 1;
  for (let i = header.length; i < size; i++) {
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    out[i] = x & 0xff;
  }
  return out;
}

const dirs: string[] = [];

export function cleanupFixtures(): void {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
}

export interface SiteSpec {
  /** Extra or replacement pages, keyed by file name under content/. */
  pages?: Record<string, unknown>;
  /** Raw page text by file name under content/ (overrides `pages`). */
  rawPages?: Record<string, string>;
  /** Image bytes keyed by path under images/. */
  images?: Record<string, Buffer>;
}

/** A content repo in a temp directory: content/index.json plus the given images. */
export function makeSiteRepo(spec: SiteSpec = {}): string {
  const root = mkdtempSync(path.join(tmpdir(), "site-kit-ingest-"));
  dirs.push(root);
  mkdirSync(path.join(root, "content"), { recursive: true });
  const pages: Record<string, unknown> = {
    "index.json": { frontMatter: { title: "Home" }, blocks: [{ type: "prose", props: { body: "Welcome." } }] },
    ...(spec.pages ?? {}),
  };
  for (const [name, value] of Object.entries(pages)) {
    writeFileSync(path.join(root, "content", name), JSON.stringify(value));
  }
  for (const [name, text] of Object.entries(spec.rawPages ?? {})) {
    writeFileSync(path.join(root, "content", name), text);
  }
  for (const [rel, bytes] of Object.entries(spec.images ?? {})) {
    const full = path.join(root, "images", rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, bytes);
  }
  return root;
}
