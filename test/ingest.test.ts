// @vitest-environment node
//
// scripts/ingest.mjs — the site-kit side of staged ingest (presby
// docs/work-log/2026-10-26-site-ingest-size.md, Phase 3; KI-1 .. KI-27).
//
// The package default is jsdom; this file needs real Buffers, Response and
// AbortSignal, hence the docblock above. Every request goes through a fake
// platform that implements the wire contract; nothing here touches a network.
// All image bytes are synthetic (see ingest-fixtures.ts).
import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cleanupFixtures, makeImage, makeSiteRepo } from "./ingest-fixtures";

interface IngestResult {
  outcome: "ingested" | "already_current";
  transport: "legacy" | "staged";
  uploaded: number;
  reused: number;
}
interface IngestModule {
  MAX_REQUEST_BYTES: number;
  MAX_MANIFEST_ENTRIES: number;
  MAX_IMAGE_BYTES: number;
  PROTOCOL: string;
  PROTOCOL_HEADER: string;
  HASH_HEADER: string;
  PATHS: Record<string, string>;
  ERROR_CODES: readonly string[];
  MANIFEST_KEY_MAX: number;
  REQUEST_TIMEOUT_MS: number;
  MAX_ATTEMPTS: number;
  RETRY_SLEEPS_MS: readonly number[];
  IngestFailure: new (...args: never[]) => Error & { id: string };
  formatBytes: (n: number) => string;
  validateManifestKey: (key: string) => boolean;
  runIngest: (opts: Record<string, unknown>) => Promise<IngestResult>;
  runFromGithubScript: (opts: Record<string, unknown>) => Promise<IngestResult | undefined>;
}
const ingest = (await import("../scripts/ingest.mjs")) as unknown as IngestModule;
const { runIngest, runFromGithubScript, IngestFailure } = ingest;

const BASE = "https://presby.example.invalid/api/sites/ingest";
const SLUG = "fixture-church";
const COMMIT_SHA = "0123456789abcdef0123456789abcdef01234567";
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

// ---------------------------------------------------------------------------
// The fake platform: the wire contract, in memory.
// ---------------------------------------------------------------------------

interface Call {
  url: string;
  kind: "legacy" | "plan" | "images" | "commit";
  headers: Record<string, string>;
  body: Buffer;
  init: RequestInit;
}
interface Platform {
  held: Set<string>;
  calls: Call[];
  state: { committed: boolean };
  maxInFlight: number;
  handle: (call: Call) => Response;
  fetch: (url: string, init: RequestInit) => Promise<Response>;
}
type Override = (call: Call, platform: Platform, n: number) => Response | Promise<Response> | undefined | Promise<undefined>;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const errJson = (status: number, code: string, error: string) => json(status, { status: "error", code, error });
const ingested = (pageCount = 1) =>
  json(200, { status: "ingested", organizationSlug: SLUG, commitSha: COMMIT_SHA, pageCount });
const alreadyCurrent = () =>
  json(200, { status: "already_current", organizationSlug: SLUG, commitSha: COMMIT_SHA });

function makePlatform(opts: { held?: string[]; alreadyCurrent?: boolean; override?: Override } = {}): Platform {
  const held = new Set(opts.held ?? []);
  const calls: Call[] = [];
  const state = { committed: opts.alreadyCurrent ?? false };
  let inFlight = 0;
  const platform: Platform = {
    held,
    calls,
    state,
    maxInFlight: 0,
    handle,
    fetch: platformFetch,
  };

  function handle(call: Call): Response {
    if (state.committed) return alreadyCurrent();
    if (call.kind === "legacy") {
      const parsed = JSON.parse(call.body.toString("utf-8"));
      for (const image of parsed.bundle.images) held.add(sha(Buffer.from(image.bytesBase64, "base64")));
      state.committed = true;
      return ingested(parsed.bundle.pages.length);
    }
    if (call.headers["x-presby-ingest-protocol"] !== "1") {
      return errJson(422, "unsupported_protocol", "Unsupported ingest protocol. Send the header x-presby-ingest-protocol: 1.");
    }
    if (call.kind === "plan") {
      const parsed = JSON.parse(call.body.toString("utf-8")) as { images: { sha256: string }[] };
      return json(200, { status: "planned", missing: parsed.images.map((i) => i.sha256).filter((h) => !held.has(h)) });
    }
    if (call.kind === "images") {
      const actual = sha(call.body);
      if (actual !== call.headers["x-presby-sha256"]) {
        return errJson(422, "hash_mismatch", "The bytes received do not match x-presby-sha256.");
      }
      held.add(actual);
      return json(200, { status: "stored", sha256: actual, byteSize: call.body.length, contentType: "image/png" });
    }
    const parsed = JSON.parse(call.body.toString("utf-8")) as {
      pages: unknown[];
      images: { manifestKey: string; sha256: string }[];
    };
    const unheld = parsed.images.filter((i) => !held.has(i.sha256));
    if (unheld.length > 0) {
      return errJson(
        422,
        "images_not_uploaded",
        `These images are not available to this site yet: ${unheld.map((i) => `"${i.manifestKey}"`).join(", ")}. Upload them, then commit again.`,
      );
    }
    state.committed = true;
    return ingested(parsed.pages.length);
  }

  async function platformFetch(url: string, init: RequestInit): Promise<Response> {
    inFlight += 1;
    platform.maxInFlight = Math.max(platform.maxInFlight, inFlight);
    try {
      await new Promise((resolve) => setImmediate(resolve));
      const headers: Record<string, string> = {};
      for (const [k, v] of Object.entries((init.headers ?? {}) as Record<string, string>)) headers[k.toLowerCase()] = String(v);
      const body =
        init.body === undefined || init.body === null
          ? Buffer.alloc(0)
          : typeof init.body === "string"
            ? Buffer.from(init.body, "utf-8")
            : Buffer.from(init.body as Uint8Array);
      const kind: Call["kind"] = url === BASE
        ? "legacy"
        : url === `${BASE}/plan`
          ? "plan"
          : url === `${BASE}/images`
            ? "images"
            : url === `${BASE}/commit`
              ? "commit"
              : (() => {
                  throw new Error(`fake platform: unexpected URL ${url}`);
                })();
      const call: Call = { url, kind, headers, body, init };
      calls.push(call);
      const overridden = await opts.override?.(call, platform, calls.length);
      return overridden ?? handle(call);
    } finally {
      inFlight -= 1;
    }
  }
  return platform;
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

interface RunOpts {
  ingestUrl?: string;
  transport?: string;
  getToken?: () => Promise<string>;
}
function harness(repoRoot: string, platform: Platform, extra: RunOpts = {}) {
  const logs: string[] = [];
  const sleeps: number[] = [];
  const tokens: string[] = [];
  const run = () =>
    runIngest({
      repoRoot,
      ingestUrl: extra.ingestUrl ?? BASE,
      transport: extra.transport,
      getToken:
        extra.getToken ??
        (async () => {
          const token = `token-${tokens.length + 1}`;
          tokens.push(token);
          return token;
        }),
      fetch: platform.fetch,
      log: (line: string) => logs.push(line),
      sleep: async (ms: number) => {
        sleeps.push(ms);
      },
    });
  return { logs, sleeps, tokens, run };
}

async function failureOf(promise: Promise<unknown>): Promise<Error & { id: string }> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(IngestFailure);
    return err as Error & { id: string };
  }
  throw new Error("expected the run to fail");
}

const authOf = (call: Call) => call.headers.authorization;

// Hints, verbatim from the Phase 3 Copy table.
const H401 =
  "The platform did not accept this job's identity. A common cause is a repository variable (PRESBY_INGEST_URL or PRESBY_OIDC_AUDIENCE) that does not match the platform's.";
const H404 = "The platform has no site set up for this repository. Contact PresbyPortal support to have it set up.";
const H503 =
  "The platform is not accepting site updates right now. Re-run this job later; if it keeps failing, contact PresbyPortal support.";
const H413 = "The platform refused the request as too large. This should not happen; contact PresbyPortal support.";
const H422a = "The platform received different bytes than were sent. Re-run this job.";
const H422b = "The platform does not recognize this file as a PNG, JPEG or WEBP. Replace the image.";
const H422c = "Re-run this job; the upload step will send them again.";
const H5xx = "Re-run this job; if it keeps failing, contact PresbyPortal support.";

// A site whose legacy body is over the 4,000,000-byte limit: four 1.5 MB images
// plus one tiny one. Built once; tests that use it never mutate it.
let bigRepo: string;
const bigImages = {
  "big1.png": makeImage("png", 1_500_000, 11),
  "big2.jpg": makeImage("jpeg", 1_500_000, 12),
  "big3.webp": makeImage("webp", 1_500_000, 13),
  "big4.png": makeImage("png", 1_500_000, 14),
  "tiny.png": makeImage("png", 200, 15),
};
beforeAll(() => {
  bigRepo = makeSiteRepo({ images: bigImages });
});
afterAll(cleanupFixtures);

const hashOfBig = (file: keyof typeof bigImages) => sha(bigImages[file]);

describe("wire contract constants", () => {
  it("KI-1: pins the literals the server must match", () => {
    expect(ingest.MAX_REQUEST_BYTES).toBe(4000000);
    expect(ingest.MAX_MANIFEST_ENTRIES).toBe(2000);
    expect(ingest.MAX_IMAGE_BYTES).toBe(4000000);
    expect(ingest.PROTOCOL).toBe("1");
    expect(ingest.PROTOCOL_HEADER).toBe("x-presby-ingest-protocol");
    expect(ingest.HASH_HEADER).toBe("x-presby-sha256");
    expect(ingest.PATHS).toEqual({ plan: "/plan", images: "/images", commit: "/commit" });
    expect(ingest.MANIFEST_KEY_MAX).toBe(200);
    expect(ingest.REQUEST_TIMEOUT_MS).toBe(120000);
    expect(ingest.MAX_ATTEMPTS).toBe(3);
    expect([...ingest.RETRY_SLEEPS_MS]).toEqual([1000, 3000]);
    expect([...ingest.ERROR_CODES].sort()).toEqual(
      [
        "unauthorized",
        "site_not_provisioned",
        "ingest_disabled",
        "request_too_large",
        "invalid_json",
        "invalid_request",
        "unsupported_protocol",
        "hash_mismatch",
        "not_an_image",
        "images_not_uploaded",
        "reserved_page",
        "image_rejected",
        "server_error",
      ].sort(),
    );
  });

  it("KI-1: the manifest-key rule is 1 to 200 code units with no control characters", () => {
    const ok = ingest.validateManifestKey;
    expect(ok("")).toBe(false);
    expect(ok("a")).toBe(true);
    expect(ok("a".repeat(200))).toBe(true);
    expect(ok("a".repeat(201))).toBe(false);
    for (const bad of ["a\u0000b", "a\u001fb", "a\u007fb", "line\nbreak", "tab\there"]) expect(ok(bad)).toBe(false);
    for (const good of ["with space", "café", "☃ snowman", ".", "__proto__", "a.b.c"]) expect(ok(good)).toBe(true);
  });

  it("formatBytes uses decimal units to match the 4,000,000 limit", () => {
    expect(ingest.formatBytes(0)).toBe("0 bytes");
    expect(ingest.formatBytes(999)).toBe("999 bytes");
    expect(ingest.formatBytes(1000)).toBe("1.0 KB");
    expect(ingest.formatBytes(1_500)).toBe("1.5 KB");
    expect(ingest.formatBytes(999_949)).toBe("999.9 KB");
    expect(ingest.formatBytes(999_950)).toBe("1.0 MB");
    expect(ingest.formatBytes(4_000_000)).toBe("4.0 MB");
    expect(ingest.formatBytes(37_794_098)).toBe("37.8 MB");
  });
});

describe("transport choice", () => {
  it("KI-2: a small site is one request to the base URL in the legacy shape, within the limit", async () => {
    const png = makeImage("png", 2_000, 1);
    const repo = makeSiteRepo({ images: { "logo.png": png } });
    const platform = makePlatform();
    const h = harness(repo, platform);
    const result = await h.run();

    expect(result).toMatchObject({ outcome: "ingested", transport: "legacy" });
    expect(platform.calls).toHaveLength(1);
    const call = platform.calls[0];
    expect(call.kind).toBe("legacy");
    expect(call.url).toBe(BASE);
    expect(call.body.length).toBeLessThanOrEqual(4_000_000);
    expect(call.headers["content-type"]).toBe("application/json");
    expect(call.headers["x-presby-ingest-protocol"]).toBeUndefined();
    const sent = JSON.parse(call.body.toString("utf-8"));
    expect(sent.bundle.schemaVersion).toBe(1);
    expect(sent.bundle.images).toEqual([
      { manifestKey: "logo", contentType: "image/png", bytesBase64: png.toString("base64") },
    ]);
    expect(h.logs).toEqual([
      "Built 1 page(s) and 1 image(s): 1 distinct, 2.0 KB.",
      expect.stringMatching(/^Sending the site as one request \(\d+(\.\d)? KB of the 4\.0 MB allowed\)\.$/),
      `Published commit 0123456 to "${SLUG}" (1 page(s)).`,
    ]);
  });

  it("KI-2: the legacy request is chosen at exactly 4,000,000 bytes and staged at 4,000,001", async () => {
    const image = makeImage("png", 2_000_000, 7);
    // Pad a page until the serialized legacy body is exactly `target` bytes.
    const repoWithBodyOf = async (target: number) => {
      let pad = 100;
      for (let round = 0; round < 3; round += 1) {
        const repo = makeSiteRepo({
          images: { "wide.png": image },
          pages: { "pad.json": { frontMatter: {}, blocks: [{ type: "prose", props: { body: "p".repeat(pad) } }] } },
        });
        const probe = makePlatform();
        const lines: string[] = [];
        // A forced-legacy dry run reveals the exact body size the client computed.
        const sent = await runIngest({
          repoRoot: repo,
          ingestUrl: BASE,
          transport: "legacy",
          getToken: async () => "token-probe",
          fetch: probe.fetch,
          log: (l: string) => lines.push(l),
          sleep: async () => {},
        }).catch(() => undefined);
        const actual = sent ? probe.calls[0].body.length : Number.NaN;
        if (actual === target) return repo;
        pad += target - actual;
      }
      throw new Error("could not reach the target body size");
    };

    const atLimit = await repoWithBodyOf(4_000_000);
    const onTheLimit = makePlatform();
    expect((await harness(atLimit, onTheLimit).run()).transport).toBe("legacy");
    expect(onTheLimit.calls[0].body.length).toBe(4_000_000);

    // One more byte of page text and it no longer fits as one request.
    const over = makeSiteRepo({
      images: { "wide.png": image },
      pages: {
        "pad.json": {
          frontMatter: {},
          blocks: [{ type: "prose", props: { body: "p".repeat(JSON.parse(onTheLimit.calls[0].body.toString("utf-8")).bundle.pages.find((x: { path: string }) => x.path === "/pad").mdxAst.blocks[0].props.body.length + 1) } }],
        },
      },
    });
    const staged = makePlatform();
    expect((await harness(over, staged).run()).transport).toBe("staged");
  });

  it("KI-3: a large site is plan, then uploads, then commit; every body within the limit; a fresh token each time", async () => {
    const platform = makePlatform();
    const h = harness(bigRepo, platform);
    const result = await h.run();

    expect(result).toEqual({ outcome: "ingested", transport: "staged", uploaded: 5, reused: 0 });
    expect(platform.calls.map((c) => c.kind)).toEqual(["plan", "images", "images", "images", "images", "images", "commit"]);
    for (const call of platform.calls) {
      expect(call.body.length).toBeLessThanOrEqual(4_000_000);
      expect(call.init.method).toBe("POST");
      expect(call.init.redirect).toBe("manual");
      expect(call.headers["x-presby-ingest-protocol"]).toBe("1");
    }
    // The exact paths.
    expect(platform.calls.map((c) => c.url)).toEqual([
      `${BASE}/plan`,
      ...Array(5).fill(`${BASE}/images`),
      `${BASE}/commit`,
    ]);
    // A new token for every request, none reused.
    expect(h.tokens).toHaveLength(platform.calls.length);
    expect(platform.calls.map(authOf)).toEqual(h.tokens.map((t) => `Bearer ${t}`));
    expect(new Set(platform.calls.map(authOf)).size).toBe(platform.calls.length);

    const plan = JSON.parse(platform.calls[0].body.toString("utf-8"));
    expect(platform.calls[0].headers["content-type"]).toBe("application/json");
    expect(plan).toEqual({
      images: [
        { sha256: hashOfBig("big1.png"), size: 1_500_000 },
        { sha256: hashOfBig("big2.jpg"), size: 1_500_000 },
        { sha256: hashOfBig("big3.webp"), size: 1_500_000 },
        { sha256: hashOfBig("big4.png"), size: 1_500_000 },
        { sha256: hashOfBig("tiny.png"), size: 200 },
      ],
    });
    for (const call of platform.calls.filter((c) => c.kind === "images")) {
      expect(call.headers["content-type"]).toBe("application/octet-stream");
      expect(call.headers["x-presby-sha256"]).toBe(sha(call.body));
    }
    const commit = JSON.parse(platform.calls[6].body.toString("utf-8"));
    expect(Object.keys(commit)).toEqual(["schemaVersion", "pages", "images"]);
    expect(commit.schemaVersion).toBe(1);
    expect(commit.pages).toHaveLength(1);
    expect(commit.images).toEqual([
      { manifestKey: "big1", sha256: hashOfBig("big1.png") },
      { manifestKey: "big2", sha256: hashOfBig("big2.jpg") },
      { manifestKey: "big3", sha256: hashOfBig("big3.webp") },
      { manifestKey: "big4", sha256: hashOfBig("big4.png") },
      { manifestKey: "tiny", sha256: hashOfBig("tiny.png") },
    ]);
  });

  it("KI-25: the staged run log is exactly the Copy table's lines", async () => {
    const h = harness(bigRepo, makePlatform());
    await h.run();
    expect(h.logs).toEqual([
      "Built 1 page(s) and 5 image(s): 5 distinct, 6.0 MB.",
      "The site is 8.0 MB as one request, over the 4.0 MB limit, so images are sent one at a time.",
      "Checking which of the 5 distinct image(s) the platform still needs.",
      "0 already on the platform; 5 to upload.",
      'Uploaded 1 of 5: "big1" (1.5 MB).',
      'Uploaded 2 of 5: "big2" (1.5 MB).',
      'Uploaded 3 of 5: "big3" (1.5 MB).',
      'Uploaded 4 of 5: "big4" (1.5 MB).',
      'Uploaded 5 of 5: "tiny" (200 bytes).',
      "Publishing 1 page(s) and 5 image reference(s).",
      `Published commit 0123456 to "${SLUG}" (1 page(s)).`,
      "Sent 5 new image(s); 0 already on the platform.",
    ]);
  });

  it("KI-25: a partly-held plan, the all-held plan, and the no-image site read as the Copy table says", async () => {
    const partial = harness(bigRepo, makePlatform({ held: [hashOfBig("big1.png"), hashOfBig("big4.png")] }));
    await partial.run();
    expect(partial.logs.slice(2, 6)).toEqual([
      "Checking which of the 5 distinct image(s) the platform still needs.",
      "2 already on the platform; 3 to upload.",
      'Uploaded 1 of 3: "big2" (1.5 MB).',
      'Uploaded 2 of 3: "big3" (1.5 MB).',
    ]);
    expect(partial.logs.at(-1)).toBe("Sent 3 new image(s); 2 already on the platform.");

    const all = harness(bigRepo, makePlatform({ held: Object.values(bigImages).map(sha) }));
    const result = await all.run();
    expect(result).toMatchObject({ uploaded: 0, reused: 5 });
    expect(all.logs[3]).toBe("All 5 image(s) are already on the platform; nothing to upload.");

    const none = harness(makeSiteRepo(), makePlatform(), { transport: "staged" });
    await none.run();
    expect(none.logs).toEqual([
      "Built 1 page(s) and 0 image(s).",
      "Staged ingest was requested, so images are sent one at a time.",
      "Checking whether the platform already has this commit.",
      "This site has no images to send.",
      "Publishing 1 page(s) and 0 image reference(s).",
      `Published commit 0123456 to "${SLUG}" (1 page(s)).`,
      "Sent 0 new image(s); 0 already on the platform.",
    ]);
  });

  it("KI-4: two keys with identical bytes upload once and commit both keys", async () => {
    const same = makeImage("png", 5_000, 21);
    const repo = makeSiteRepo({ images: { "first.png": same, "second.png": same, "other.png": makeImage("png", 900, 22) } });
    const platform = makePlatform();
    const h = harness(repo, platform, { transport: "staged" });
    const result = await h.run();

    expect(result.uploaded).toBe(2);
    expect(platform.calls.filter((c) => c.kind === "images")).toHaveLength(2);
    const plan = JSON.parse(platform.calls[0].body.toString("utf-8"));
    expect(plan.images).toHaveLength(2);
    const commit = JSON.parse(platform.calls.at(-1)!.body.toString("utf-8"));
    expect(commit.images.map((i: { manifestKey: string }) => i.manifestKey)).toEqual(["first", "other", "second"]);
    expect(commit.images[0].sha256).toBe(commit.images[2].sha256);
    expect(h.logs).toContain("Built 1 page(s) and 3 image(s): 2 distinct, 10.9 KB.");
    expect(h.logs).toContain("Publishing 1 page(s) and 3 image reference(s).");
  });

  it("KI-27: uploads follow manifest-key order, not directory order", async () => {
    const repo = makeSiteRepo({
      images: {
        "z-last.png": makeImage("png", 50, 31),
        "a-first.png": makeImage("png", 51, 32),
        "m-middle.png": makeImage("png", 52, 33),
      },
    });
    const platform = makePlatform();
    await harness(repo, platform, { transport: "staged" }).run();
    const uploaded = platform.calls.filter((c) => c.kind === "images").map((c) => c.body.length);
    expect(uploaded).toEqual([51, 52, 50]);
  });

  it("KI-18: transport=staged forces staged on a small site", async () => {
    const repo = makeSiteRepo({ images: { "a.png": makeImage("png", 100, 41) } });
    const platform = makePlatform();
    const h = harness(repo, platform, { transport: "staged" });
    const result = await h.run();
    expect(result.transport).toBe("staged");
    expect(platform.calls[0].kind).toBe("plan");
    expect(h.logs[1]).toBe("Staged ingest was requested, so images are sent one at a time.");
  });

  it("KI-18: transport=legacy on an oversize site is E7 and sends nothing", async () => {
    const platform = makePlatform();
    const failure = await failureOf(harness(bigRepo, platform, { transport: "legacy" }).run());
    expect(failure.id).toBe("E7");
    expect(failure.message).toBe(
      'Transport "legacy" was requested, but the site is 8.0 MB as one request and the limit is 4.0 MB. Use transport "auto" or "staged". Nothing was sent.',
    );
    expect(platform.calls).toHaveLength(0);
  });

  it("KI-18: transport=legacy on a small site sends the legacy request", async () => {
    const repo = makeSiteRepo({ images: { "a.png": makeImage("png", 100, 42) } });
    const platform = makePlatform();
    const result = await harness(repo, platform, { transport: "legacy" }).run();
    expect(result.transport).toBe("legacy");
    expect(platform.calls.map((c) => c.kind)).toEqual(["legacy"]);
  });

  it("KI-18: an unknown transport is E8 and sends nothing", async () => {
    const platform = makePlatform();
    const failure = await failureOf(harness(bigRepo, platform, { transport: "chunked" }).run());
    expect(failure.id).toBe("E8");
    expect(failure.message).toBe('Unknown transport "chunked". Use "auto", "staged" or "legacy". Nothing was sent.');
    expect(platform.calls).toHaveLength(0);
  });

  it("KI-22: trailing slashes on the ingest URL are stripped and the three paths are appended", async () => {
    const platform = makePlatform();
    await harness(bigRepo, platform, { ingestUrl: `${BASE}///` }).run();
    expect(new Set(platform.calls.map((c) => c.url))).toEqual(
      new Set([`${BASE}/plan`, `${BASE}/images`, `${BASE}/commit`]),
    );
    const legacy = makePlatform();
    await harness(makeSiteRepo(), legacy, { ingestUrl: `${BASE}/` }).run();
    expect(legacy.calls[0].url).toBe(BASE);
  });

  it("KI-23: never more than one request is in flight", async () => {
    const platform = makePlatform();
    await harness(bigRepo, platform).run();
    expect(platform.maxInFlight).toBe(1);
  });
});

describe("already current", () => {
  it("KI-6: already_current from the plan is success and stops", async () => {
    const platform = makePlatform({ alreadyCurrent: true });
    const h = harness(bigRepo, platform);
    const result = await h.run();
    expect(result).toEqual({ outcome: "already_current", transport: "staged", uploaded: 0, reused: 0 });
    expect(platform.calls.map((c) => c.kind)).toEqual(["plan"]);
    expect(h.logs.at(-1)).toBe("The platform has already ingested commit 0123456; nothing to do.");
  });

  it("KI-6: already_current from the legacy request is success", async () => {
    const platform = makePlatform({ alreadyCurrent: true });
    const h = harness(makeSiteRepo(), platform);
    const result = await h.run();
    expect(result).toMatchObject({ outcome: "already_current", transport: "legacy" });
    expect(h.logs.at(-1)).toBe("The platform has already ingested commit 0123456; nothing to do.");
  });

  it("KI-7: already_current from an upload or from the commit is success and stops", async () => {
    const fromUpload = makePlatform({
      override: (call) => (call.kind === "images" ? alreadyCurrent() : undefined),
    });
    const a = harness(bigRepo, fromUpload);
    expect(await a.run()).toMatchObject({ outcome: "already_current", uploaded: 0 });
    expect(fromUpload.calls.map((c) => c.kind)).toEqual(["plan", "images"]);

    const fromCommit = makePlatform({
      override: (call) => (call.kind === "commit" ? alreadyCurrent() : undefined),
    });
    const b = harness(bigRepo, fromCommit);
    expect(await b.run()).toMatchObject({ outcome: "already_current", uploaded: 5 });
    expect(b.logs.at(-1)).toBe("The platform has already ingested commit 0123456; nothing to do.");
  });

  it("KI-21: a lost commit response, retried, comes back already_current and succeeds", async () => {
    let commits = 0;
    const platform = makePlatform({
      override: (call, p) => {
        if (call.kind !== "commit") return undefined;
        commits += 1;
        if (commits === 1) {
          p.handle(call); // the platform processed it ...
          throw new TypeError("fetch failed"); // ... but the reply never arrived
        }
        return undefined;
      },
    });
    const h = harness(bigRepo, platform);
    const result = await h.run();
    expect(result.outcome).toBe("already_current");
    expect(platform.calls.filter((c) => c.kind === "commit")).toHaveLength(2);
    expect(h.sleeps).toEqual([1000]);
  });
});

describe("limits checked before anything is sent", () => {
  it("KI-8: an image of 4,000,001 bytes is E1 with zero requests", async () => {
    const repo = makeSiteRepo({ images: { "huge.png": makeImage("png", 4_000_001, 51) } });
    const platform = makePlatform();
    const failure = await failureOf(harness(repo, platform).run());
    expect(failure.id).toBe("E1");
    expect(failure.message).toBe(
      'Image "images/huge.png" is 4000001 bytes; the limit is 4,000,000 bytes (about 4 MB). Make the image smaller, then push again. Nothing was sent.',
    );
    expect(platform.calls).toHaveLength(0);
  });

  it("KI-9: an image of exactly 4,000,000 bytes is uploaded as a body of exactly 4,000,000", async () => {
    const repo = makeSiteRepo({ images: { "edge.png": makeImage("png", 4_000_000, 52) } });
    const platform = makePlatform();
    await harness(repo, platform).run();
    const upload = platform.calls.find((c) => c.kind === "images");
    expect(upload?.body.length).toBe(4_000_000);
    expect(platform.calls.map((c) => c.kind)).toEqual(["plan", "images", "commit"]);
  });

  it("KI-10: an empty image is E2 and a non-image is E3, both with zero requests", async () => {
    const platform = makePlatform();
    const empty = await failureOf(
      harness(makeSiteRepo({ images: { "blank.png": Buffer.alloc(0) } }), platform).run(),
    );
    expect(empty.id).toBe("E2");
    expect(empty.message).toBe('Image "images/blank.png" is empty. Remove it or replace it, then push again. Nothing was sent.');

    const wrong = await failureOf(
      harness(makeSiteRepo({ images: { "gif.png": Buffer.from("GIF89a-not-allowed") } }), platform).run(),
    );
    expect(wrong.id).toBe("E3");
    expect(wrong.message).toBe(
      'Image "images/gif.png" is not a PNG, JPEG or WEBP file, whatever its name says. Replace or remove it, then push again. Nothing was sent.',
    );
    expect(platform.calls).toHaveLength(0);
  });

  it("KI-10: two images that would share a manifest key are E4 with zero requests", async () => {
    const platform = makePlatform();
    const repo = makeSiteRepo({ images: { "a.png": makeImage("png", 60, 1), "a.jpg": makeImage("jpeg", 60, 2) } });
    const failure = await failureOf(harness(repo, platform).run());
    expect(failure.id).toBe("E4");
    expect(failure.message).toBe(
      'Images "images/a.jpg" and "images/a.png" would both be called "a". Give each image a different file name (the part before the extension), then push again. Nothing was sent.',
    );
    expect(platform.calls).toHaveLength(0);
  });

  it("KI-11: 2,001 images are E5 with zero requests; 2,000 are accepted", async () => {
    const files = (n: number) =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => [`img-${String(i).padStart(4, "0")}.png`, makeImage("png", 12, i)]));
    const platform = makePlatform();
    const failure = await failureOf(harness(makeSiteRepo({ images: files(2001) }), platform).run());
    expect(failure.id).toBe("E5");
    expect(failure.message).toBe(
      "This site has 2001 images; at most 2,000 can be published at once. Remove some, then push again. Nothing was sent.",
    );
    expect(platform.calls).toHaveLength(0);

    const ok = makePlatform({ alreadyCurrent: true });
    await harness(makeSiteRepo({ images: files(2000) }), ok, { transport: "staged" }).run();
    const plan = JSON.parse(ok.calls[0].body.toString("utf-8"));
    expect(plan.images).toHaveLength(2000);
  });

  it("KI-12: page content over the limit is E6 with zero requests", async () => {
    const repo = makeSiteRepo({ pages: { "long.json": { frontMatter: {}, blocks: [{ type: "prose", props: { body: "x".repeat(4_100_000) } }] } } });
    const platform = makePlatform();
    const failure = await failureOf(harness(repo, platform).run());
    expect(failure.id).toBe("E6");
    expect(failure.message).toMatch(
      /^The page content is \d+ bytes; one request is limited to 4,000,000 bytes\. Shorten or remove some pages, then push again\. Nothing was sent\.$/,
    );
    expect(platform.calls).toHaveLength(0);
  });

  it("an invalid manifest key on the staged path is refused before any request", async () => {
    const repo = makeSiteRepo({ images: { ["k".repeat(201) + ".png"]: makeImage("png", 40, 1) } });
    const platform = makePlatform();
    const failure = await failureOf(harness(repo, platform, { transport: "staged" }).run());
    expect(failure.id).toBe("E17");
    expect(failure.message).toContain("1 to 200 characters");
    expect(failure.message.endsWith("Nothing was sent.")).toBe(true);
    expect(platform.calls).toHaveLength(0);
  });

  it("a site with no readable pages is a named failure with zero requests", async () => {
    const repo = makeSiteRepo({ rawPages: { "broken.json": "{ not json" } });
    const platform = makePlatform();
    const failure = await failureOf(harness(repo, platform).run());
    expect(failure.id).toBe("E18");
    expect(failure.message).toMatch(/^Could not read the site: Malformed JSON in .*broken\.json/);
    expect(failure.message.endsWith("Nothing was sent.")).toBe(true);
    expect(platform.calls).toHaveLength(0);
  });
});

describe("server rejections are readable", () => {
  it.each([
    ["plan", 401, "unauthorized", "Invalid token.", H401],
    ["plan", 404, "site_not_provisioned", "No site is provisioned for this repository.", H404],
    ["plan", 503, "ingest_disabled", "Site ingest is currently disabled.", H503],
    ["plan", 413, "request_too_large", "Request body is larger than 4,000,000 bytes.", H413],
  ])("KI-13: %s answering %i prints the step, the status, the server text and the hint", async (step, status, code, text, hint) => {
    const platform = makePlatform({ override: () => errJson(status as number, code as string, text as string) });
    const failure = await failureOf(harness(bigRepo, platform).run());
    expect(failure.id).toBe("E9");
    expect(failure.message).toBe(`Step "${step}": the platform answered ${status}: ${text}\n${hint}`);
    // A 5xx is retried (design: "any HTTP status 500 or above"), a 4xx never.
    expect(platform.calls).toHaveLength((status as number) >= 500 ? 3 : 1);
  });

  it("KI-13: a refused upload names the image and carries the hash_mismatch hint", async () => {
    const platform = makePlatform({
      override: (call) =>
        call.kind === "images"
          ? errJson(422, "hash_mismatch", "The bytes received do not match x-presby-sha256.")
          : undefined,
    });
    const failure = await failureOf(harness(bigRepo, platform).run());
    expect(failure.message).toBe(
      `Step "upload" for image "big1": the platform answered 422: The bytes received do not match x-presby-sha256.\n${H422a}`,
    );
    expect(platform.calls.map((c) => c.kind)).toEqual(["plan", "images"]);
  });

  it("KI-13: not_an_image carries its hint; any other 422 stands alone", async () => {
    const notImage = makePlatform({
      override: (call) => (call.kind === "images" ? errJson(422, "not_an_image", "The uploaded file is not a PNG, JPEG, or WEBP.") : undefined),
    });
    const a = await failureOf(harness(bigRepo, notImage).run());
    expect(a.message).toBe(
      `Step "upload" for image "big1": the platform answered 422: The uploaded file is not a PNG, JPEG, or WEBP.\n${H422b}`,
    );
    const other = makePlatform({
      override: (call) => (call.kind === "commit" ? errJson(422, "reserved_page", 'Page "/give" is reserved.') : undefined),
    });
    const b = await failureOf(harness(bigRepo, other).run());
    expect(b.message).toBe('Step "commit": the platform answered 422: Page "/give" is reserved.');
  });

  it("KI-13: images_not_uploaded at the commit carries its hint", async () => {
    const platform = makePlatform({
      override: (call) =>
        call.kind === "commit"
          ? errJson(422, "images_not_uploaded", 'These images are not available to this site yet: "big1". Upload them, then commit again.')
          : undefined,
    });
    const failure = await failureOf(harness(bigRepo, platform).run());
    expect(failure.message).toBe(
      `Step "commit": the platform answered 422: These images are not available to this site yet: "big1". Upload them, then commit again.\n${H422c}`,
    );
  });

  it("KI-13: the legacy request names its step too", async () => {
    const platform = makePlatform({ override: () => errJson(401, "unauthorized", "Invalid token.") });
    const failure = await failureOf(harness(makeSiteRepo(), platform).run());
    expect(failure.message).toBe(`Step "ingest": the platform answered 401: Invalid token.\n${H401}`);
  });

  it("KI-15: a 404 on /plan that is not our error format says the platform lacks staged ingest", async () => {
    const platform = makePlatform({
      override: () => new Response("<html>This page could not be found.</html>", { status: 404 }),
    });
    const failure = await failureOf(harness(bigRepo, platform).run());
    expect(failure.id).toBe("E12");
    expect(failure.message).toBe(
      'The platform does not support staged ingest yet (the "plan" step answered 404 without the usual error format). This large site cannot be published until the platform is updated; small sites are not affected. Re-run this job after the update, or contact PresbyPortal support.',
    );
  });

  it("KI-15: a 404 in our format on /plan is the provisioning hint, never E12", async () => {
    const platform = makePlatform({ override: () => errJson(404, "site_not_provisioned", "No site is provisioned for this repository.") });
    const failure = await failureOf(harness(bigRepo, platform).run());
    expect(failure.id).toBe("E9");
    expect(failure.message).not.toContain("does not support staged ingest");
  });

  it("KI-16: a plain-text platform 413 or an HTML body is E13 with the trimmed text", async () => {
    const text = makePlatform({
      override: () => new Response("  Request Entity Too Large  \n", { status: 413 }),
    });
    const a = await failureOf(harness(bigRepo, text).run());
    expect(a.id).toBe("E13");
    expect(a.message).toBe(
      'Step "plan": the platform sent a reply this tool does not understand (413): Request Entity Too Large. Nothing was published.',
    );
    const html = makePlatform({
      override: () => new Response("<!doctype html>" + "y".repeat(500), { status: 400 }),
    });
    const b = await failureOf(harness(bigRepo, html).run());
    expect(b.message).toContain(`: <!doctype html>${"y".repeat(185)}. Nothing was published.`);
  });

  it("KI-19: a 200 with an unknown body is E13; plan and upload say nothing was published, commit and legacy say it may have been", async () => {
    const unknown = () => json(200, { hello: "world" });
    const plan = await failureOf(harness(bigRepo, makePlatform({ override: unknown })).run());
    expect(plan.message).toBe(
      'Step "plan": the platform sent a reply this tool does not understand (200): {"hello":"world"}. Nothing was published.',
    );
    const upload = await failureOf(
      harness(bigRepo, makePlatform({ override: (c) => (c.kind === "images" ? unknown() : undefined) })).run(),
    );
    expect(upload.message).toContain("Nothing was published.");
    const mayHave = 'The site may or may not have been published; re-run this job, which will say so if it was.';
    const commit = await failureOf(
      harness(bigRepo, makePlatform({ override: (c) => (c.kind === "commit" ? unknown() : undefined) })).run(),
    );
    expect(commit.message).toBe(
      `Step "commit": the platform sent a reply this tool does not understand (200): {"hello":"world"}. ${mayHave}`,
    );
    const legacy = await failureOf(harness(makeSiteRepo(), makePlatform({ override: unknown })).run());
    expect(legacy.message).toBe(
      `Step "ingest": the platform sent a reply this tool does not understand (200): {"hello":"world"}. ${mayHave}`,
    );
  });

  it("KI-19: a plan that names a hash we never sent is not trusted", async () => {
    const platform = makePlatform({
      override: (c) => (c.kind === "plan" ? json(200, { status: "planned", missing: ["f".repeat(64)] }) : undefined),
    });
    const failure = await failureOf(harness(bigRepo, platform).run());
    expect(failure.id).toBe("E13");
  });

  it("KI-24: a redirect is not followed; it names the address to put in PRESBY_INGEST_URL", async () => {
    const platform = makePlatform({
      override: () => new Response(null, { status: 307, headers: { location: "https://www.presby.example.invalid/api/sites/ingest/plan" } }),
    });
    const failure = await failureOf(harness(bigRepo, platform).run());
    expect(failure.id).toBe("E14");
    expect(failure.message).toBe(
      'Step "plan": the platform redirected this request to https://www.presby.example.invalid. Set the PRESBY_INGEST_URL repository variable to that address (ending in /api/sites/ingest), then re-run this job.',
    );
    expect(platform.calls).toHaveLength(1);
    expect(platform.calls[0].init.redirect).toBe("manual");
  });
});

describe("retries and tokens", () => {
  it("KI-14: a thrown fetch twice then success continues; sleeps are 1000 then 3000; a token per attempt", async () => {
    let planCalls = 0;
    const platform = makePlatform({
      override: (call) => {
        if (call.kind === "plan" && ++planCalls <= 2) throw new TypeError("fetch failed");
        return undefined;
      },
    });
    const h = harness(bigRepo, platform);
    const result = await h.run();
    expect(result.outcome).toBe("ingested");
    expect(h.sleeps).toEqual([1000, 3000]);
    expect(h.tokens).toHaveLength(platform.calls.length);
    expect(platform.calls.filter((c) => c.kind === "plan")).toHaveLength(3);
    expect(new Set(platform.calls.map(authOf)).size).toBe(platform.calls.length);
  });

  it("KI-14: three thrown fetches is E10, naming the step and the cause", async () => {
    const platform = makePlatform({
      override: (call) => {
        if (call.kind === "images") throw Object.assign(new TypeError("fetch failed"), { cause: new Error("connect ECONNRESET") });
        return undefined;
      },
    });
    const h = harness(bigRepo, platform);
    const failure = await failureOf(h.run());
    expect(failure.id).toBe("E10");
    expect(failure.message).toBe(
      'Step "upload" for image "big1": could not reach the platform (fetch failed: connect ECONNRESET) after 3 attempts. Re-run this job; if it keeps failing, contact PresbyPortal support.',
    );
    expect(h.sleeps).toEqual([1000, 3000]);
    expect(h.tokens).toHaveLength(platform.calls.length);
  });

  it("KI-14: a 5xx is retried; three 5xx is E9 with the server error hint", async () => {
    const platform = makePlatform({
      override: (call) => (call.kind === "commit" ? errJson(500, "server_error", "The platform hit an unexpected error. Try again.") : undefined),
    });
    const h = harness(bigRepo, platform);
    const failure = await failureOf(h.run());
    expect(failure.message).toBe(
      `Step "commit": the platform answered 500: The platform hit an unexpected error. Try again.\n${H5xx}`,
    );
    expect(platform.calls.filter((c) => c.kind === "commit")).toHaveLength(3);
    expect(h.sleeps).toEqual([1000, 3000]);
  });

  it("KI-14: a 5xx then success continues", async () => {
    let seen = 0;
    const platform = makePlatform({
      override: (call) => (call.kind === "plan" && ++seen === 1 ? new Response("Bad Gateway", { status: 502 }) : undefined),
    });
    const h = harness(bigRepo, platform);
    expect((await h.run()).outcome).toBe("ingested");
    expect(h.sleeps).toEqual([1000]);
  });

  it("KI-14: a 4xx is never retried", async () => {
    const platform = makePlatform({ override: () => errJson(401, "unauthorized", "Invalid token.") });
    const h = harness(bigRepo, platform);
    await failureOf(h.run());
    expect(platform.calls).toHaveLength(1);
    expect(h.sleeps).toEqual([]);
  });

  it("KI-17: when GitHub will not issue a token the run stops with E11 and no request", async () => {
    const platform = makePlatform();
    const h = harness(bigRepo, platform, {
      getToken: async () => {
        throw new Error("Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable");
      },
    });
    const failure = await failureOf(h.run());
    expect(failure.id).toBe("E11");
    expect(failure.message).toBe(
      'Step "plan": GitHub did not issue an identity token (Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable). Re-run this job.',
    );
    expect(platform.calls).toHaveLength(0);
  });

  it("KI-3: getToken is called exactly once per fetch, retries included", async () => {
    let fetches = 0;
    let tokenCalls = 0;
    let failedOnce = false;
    const platform = makePlatform({
      override: (call) => {
        if (call.kind === "images" && !failedOnce) {
          failedOnce = true;
          throw new TypeError("fetch failed");
        }
        return undefined;
      },
    });
    const counting = async (url: string, init: RequestInit) => {
      fetches += 1;
      return platform.fetch(url, init);
    };
    await runIngest({
      repoRoot: bigRepo,
      ingestUrl: BASE,
      getToken: async () => `token-${++tokenCalls}`,
      fetch: counting,
      log: () => {},
      sleep: async () => {},
    });
    expect(tokenCalls).toBe(fetches);
  });
});

describe("convergence", () => {
  it("KI-20: an interrupted run is finished by a re-run that uploads only the rest, and a third run is already current", async () => {
    let failing = true;
    const platform = makePlatform({
      override: (call, p) => {
        if (failing && call.kind === "images" && p.calls.filter((c) => c.kind === "images").length > 3) {
          throw new TypeError("fetch failed");
        }
        return undefined;
      },
    });
    const first = harness(bigRepo, platform);
    const failure = await failureOf(first.run());
    expect(failure.id).toBe("E10");
    expect(platform.held.size).toBe(3);
    expect(platform.state.committed).toBe(false);

    failing = false;
    platform.calls.length = 0;
    const second = harness(bigRepo, platform);
    const result = await second.run();
    expect(result).toMatchObject({ outcome: "ingested", uploaded: 2, reused: 3 });
    expect(platform.calls.filter((c) => c.kind === "images")).toHaveLength(2);

    platform.calls.length = 0;
    const third = harness(bigRepo, platform);
    expect(await third.run()).toMatchObject({ outcome: "already_current" });
    expect(third.logs.at(-1)).toBe("The platform has already ingested commit 0123456; nothing to do.");
    expect(platform.calls).toHaveLength(1);
  });
});

describe("runFromGithubScript", () => {
  function fakeCore() {
    const events = { info: [] as string[], failed: [] as string[], audiences: [] as string[] };
    return {
      events,
      core: {
        info: (m: string) => events.info.push(m),
        setFailed: (m: string) => events.failed.push(m),
        getIDToken: async (aud: string) => {
          events.audiences.push(aud);
          return `token-${events.audiences.length}`;
        },
      },
    };
  }

  it("KI-26: asks GitHub for a token with the audience for every request and logs through core.info", async () => {
    const platform = makePlatform();
    const { core, events } = fakeCore();
    const result = await runFromGithubScript({
      core,
      repoRoot: bigRepo,
      ingestUrl: BASE,
      audience: "presby.example.invalid",
      transport: "auto",
      fetch: platform.fetch,
      sleep: async () => {},
    });
    expect(result?.outcome).toBe("ingested");
    expect(events.failed).toEqual([]);
    expect(events.audiences).toHaveLength(platform.calls.length);
    expect(new Set(events.audiences)).toEqual(new Set(["presby.example.invalid"]));
    expect(events.info.at(-1)).toBe("Sent 5 new image(s); 0 already on the platform.");
  });

  it("KI-26: an IngestFailure becomes core.setFailed(message) and does not throw", async () => {
    const platform = makePlatform({ override: () => errJson(401, "unauthorized", "Invalid token.") });
    const { core, events } = fakeCore();
    await expect(
      runFromGithubScript({ core, repoRoot: bigRepo, ingestUrl: BASE, audience: "a", fetch: platform.fetch, sleep: async () => {} }),
    ).resolves.toBeUndefined();
    expect(events.failed).toEqual([`Step "plan": the platform answered 401: Invalid token.\n${H401}`]);
  });

  it("KI-26: an unexpected error becomes setFailed with the E16 wording", async () => {
    const { core, events } = fakeCore();
    await runFromGithubScript({
      core,
      repoRoot: bigRepo,
      ingestUrl: BASE,
      audience: "a",
      sleep: async () => {},
      fetch: async () => ({
        text: async () => "",
        get status(): number {
          throw new Error("boom");
        },
      }),
    });
    expect(events.failed).toEqual([
      "Unexpected error in the ingest tool: boom. Re-run this job; if it keeps failing, contact PresbyPortal support.",
    ]);
  });

  it("KI-26: a token failure surfaces as E11 through core.setFailed", async () => {
    const { core, events } = fakeCore();
    core.getIDToken = async () => {
      throw new Error("no token for you");
    };
    await runFromGithubScript({ core, repoRoot: bigRepo, ingestUrl: BASE, audience: "a" });
    expect(events.failed).toEqual(['Step "plan": GitHub did not issue an identity token (no token for you). Re-run this job.']);
  });
});
