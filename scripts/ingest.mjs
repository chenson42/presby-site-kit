// ingest.mjs -- the client side of presby's site ingest (presby DECISION-279,
// docs/work-log/2026-10-26-site-ingest-size.md in the presby repo).
//
// Why this exists: the platform refuses any request body over 4.5 MB before
// route code runs, and a congregation's photos made the old single request
// 37 MB. A site that fits in one request (<= 4,000,000 bytes, the exact
// serialized body) is still sent as the old single POST. A larger site is
// sent in steps:
//
//   1. POST {base}/plan     which of my images (by sha256) do you still lack?
//   2. POST {base}/images   the raw bytes of ONE missing image, repeated
//   3. POST {base}/commit   the pages + {manifestKey, sha256} for every image
//
// The platform keeps no session between steps; what it already holds is the
// staging area, so a failed run is finished by simply re-running it, and the
// site visitors see changes only when the commit succeeds.
//
// Everything that touches the outside world is passed in -- the token getter
// (actions/github-script's core.getIDToken), fetch, the log sink and sleep --
// so the whole protocol is unit-tested with fakes (test/ingest.test.ts).
// There is no dependency, and this file never imports @actions/core.
//
// THE WIRE CONTRACT BELOW IS PINNED IDENTICALLY IN THE PRESBY REPOSITORY.
// Changing any literal here without changing the server (and the test that
// asserts it, in both repos) breaks every site's publish.

import { readFileSync } from "node:fs";
import {
  BuildError,
  buildManifest,
  legacyBodyBytes,
  legacyBundleFromManifest,
} from "./build-bundle.mjs";

// --- The wire contract ------------------------------------------------------

/** Per request BODY, all four routes. A body of exactly this size is accepted. */
export const MAX_REQUEST_BYTES = 4000000;
/** Max `images` entries in a plan, a commit and a legacy bundle. */
export const MAX_MANIFEST_ENTRIES = 2000;
/** An image is one request body, so it equals MAX_REQUEST_BYTES. */
export const MAX_IMAGE_BYTES = 4000000;
export const PROTOCOL = "1";
export const PROTOCOL_HEADER = "x-presby-ingest-protocol";
export const HASH_HEADER = "x-presby-sha256";
export const PATHS = { plan: "/plan", images: "/images", commit: "/commit" };
/** Manifest key: 1 to this many UTF-16 code units, no U+0000-U+001F, no U+007F. */
export const MANIFEST_KEY_MAX = 200;
export const REQUEST_TIMEOUT_MS = 120000;
export const MAX_ATTEMPTS = 3;
/** Sleeps between attempts: after the first failure, then after the second. */
export const RETRY_SLEEPS_MS = [1000, 3000];
/** The closed set of `code` values in a platform error body. */
export const ERROR_CODES = [
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
];

// --- Small helpers ------------------------------------------------------------

/** Decimal units, to match the 4,000,000 limit: "999 bytes", "1.5 KB", "4.0 MB". */
export function formatBytes(n) {
  if (n < 1000) return `${n} bytes`;
  if (n < 999950) return `${(n / 1000).toFixed(1)} KB`;
  return `${(n / 1000000).toFixed(1)} MB`;
}

export function validateManifestKey(key) {
  return (
    typeof key === "string" &&
    key.length >= 1 &&
    key.length <= MANIFEST_KEY_MAX &&
    // eslint-disable-next-line no-control-regex
    !/[\u0000-\u001f\u007f]/.test(key)
  );
}

/** A failure the person reading the run log can act on. `id` is the Copy-table id. */
export class IngestFailure extends Error {
  constructor(id, message) {
    super(message);
    this.name = "IngestFailure";
    this.id = id;
  }
}

const messageOf = (err) => (err instanceof Error ? err.message : String(err));

const HINTS = {
  401: "The platform did not accept this job's identity. A common cause is a repository variable (PRESBY_INGEST_URL or PRESBY_OIDC_AUDIENCE) that does not match the platform's.",
  404: "The platform has no site set up for this repository. Contact PresbyPortal support to have it set up.",
  503: "The platform is not accepting site updates right now. Re-run this job later; if it keeps failing, contact PresbyPortal support.",
  413: "The platform refused the request as too large. This should not happen; contact PresbyPortal support.",
  hash_mismatch: "The platform received different bytes than were sent. Re-run this job.",
  not_an_image: "The platform does not recognize this file as a PNG, JPEG or WEBP. Replace the image.",
  images_not_uploaded: "Re-run this job; the upload step will send them again.",
  5: "Re-run this job; if it keeps failing, contact PresbyPortal support.",
};

function hintFor(status, code) {
  if (status === 401 || status === 404 || status === 503 || status === 413) return HINTS[status];
  if (status === 422) return HINTS[code];
  if (status >= 500) return HINTS[5];
  return undefined;
}

const BUILD_ERROR_IDS = { image_empty: "E2", image_not_image: "E3", key_collision: "E4" };

const where = (step, key) => `Step "${step}"${key ? ` for image "${key}"` : ""}`;

// --- One request, with retries, a fresh token and a readable failure ------------

async function send(ctx, { step, key, url, headers, body }) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    // A new token for EVERY request, retries included: a GitHub OIDC token
    // lives only minutes and a cold 80-image run takes longer than that.
    let token;
    try {
      token = await ctx.getToken();
    } catch (err) {
      throw new IngestFailure(
        "E11",
        `Step "${step}": GitHub did not issue an identity token (${messageOf(err)}). Re-run this job.`,
      );
    }

    let res;
    let text;
    try {
      res = await ctx.fetch(url, {
        method: "POST",
        headers: { ...headers, authorization: `Bearer ${token}` },
        body,
        // A redirect would drop the Authorization header across origins and
        // surface as a misleading 401; report it instead (E14).
        redirect: "manual",
        signal: AbortSignal.timeout(ctx.timeoutMs),
      });
      text = await res.text();
    } catch (err) {
      if (attempt < MAX_ATTEMPTS) {
        await ctx.sleep(RETRY_SLEEPS_MS[attempt - 1]);
        continue;
      }
      const cause =
        err instanceof Error && err.cause instanceof Error && err.cause.message
          ? `${err.message}: ${err.cause.message}`
          : messageOf(err);
      throw new IngestFailure(
        "E10",
        `${where(step, key)}: could not reach the platform (${cause}) after ${MAX_ATTEMPTS} attempts. Re-run this job; if it keeps failing, contact PresbyPortal support.`,
      );
    }

    const status = res.status;
    if (status >= 500 && attempt < MAX_ATTEMPTS) {
      await ctx.sleep(RETRY_SLEEPS_MS[attempt - 1]);
      continue;
    }
    return interpret({ step, key, status, text, res, url });
  }
  /* c8 ignore next */
  throw new Error("unreachable");
}

function interpret({ step, key, status, text, res, url }) {
  if ((status >= 300 && status < 400) || res.type === "opaqueredirect") {
    let origin = "another address";
    const location = res.headers && typeof res.headers.get === "function" ? res.headers.get("location") : null;
    if (location) {
      try {
        origin = new URL(location, url).origin;
      } catch {
        origin = location;
      }
    }
    throw new IngestFailure(
      "E14",
      `Step "${step}": the platform redirected this request to ${origin}. Set the PRESBY_INGEST_URL repository variable to that address (ending in /api/sites/ingest), then re-run this job.`,
    );
  }

  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  // "Our format" is a parseable JSON object whose `status` is a string.
  const ours = body !== null && typeof body === "object" && !Array.isArray(body) && typeof body.status === "string";

  if (!ours) {
    if (step === "plan" && status === 404) {
      throw new IngestFailure(
        "E12",
        'The platform does not support staged ingest yet (the "plan" step answered 404 without the usual error format). This large site cannot be published until the platform is updated; small sites are not affected. Re-run this job after the update, or contact PresbyPortal support.',
      );
    }
    throw notUnderstood(step, status, text);
  }

  if (body.status === "error") {
    const serverText = typeof body.error === "string" && body.error ? body.error : "(no message)";
    const hint = hintFor(status, body.code);
    throw new IngestFailure(
      "E9",
      `${where(step, key)}: the platform answered ${status}: ${serverText}${hint ? `\n${hint}` : ""}`,
    );
  }

  if (status < 200 || status >= 300) throw notUnderstood(step, status, text);
  return body;
}

function notUnderstood(step, status, text) {
  const snippet = text.trim().slice(0, 200) || "(no text)";
  const tail =
    step === "plan" || step === "upload"
      ? "Nothing was published."
      : "The site may or may not have been published; re-run this job, which will say so if it was.";
  return new IngestFailure(
    "E13",
    `Step "${step}": the platform sent a reply this tool does not understand (${status}): ${snippet}. ${tail}`,
  );
}

const short = (sha) => (typeof sha === "string" && sha ? sha.slice(0, 7) : "(unknown)");

function reportAlreadyCurrent(log, body) {
  log(`The platform has already ingested commit ${short(body.commitSha)}; nothing to do.`);
}

function reportIngested(ctx, step, body) {
  if (
    typeof body.commitSha !== "string" ||
    typeof body.organizationSlug !== "string" ||
    typeof body.pageCount !== "number"
  ) {
    throw notUnderstood(step, 200, JSON.stringify(body));
  }
  ctx.log(`Sent commit ${short(body.commitSha)} to "${body.organizationSlug}" (${body.pageCount} page(s)); the platform has ingested it.`);
}

// --- The run -------------------------------------------------------------------

/**
 * Publish the site at `repoRoot`. Returns
 * `{ outcome: "ingested" | "already_current", transport, uploaded, reused }`
 * or throws IngestFailure. Everything that fails before the first request
 * says so ("Nothing was sent."); nothing else claims the site is untouched.
 */
export async function runIngest({
  repoRoot,
  ingestUrl,
  getToken,
  fetch = globalThis.fetch,
  log = (line) => console.log(line),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  transport,
  timeoutMs = REQUEST_TIMEOUT_MS,
}) {
  const ctx = { getToken, fetch, log, sleep, timeoutMs };
  const base = String(ingestUrl).replace(/\/+$/, "");

  const mode = transport === undefined || transport === null || transport === "" ? "auto" : transport;
  if (mode !== "auto" && mode !== "staged" && mode !== "legacy") {
    throw new IngestFailure(
      "E8",
      `Unknown transport "${mode}". Use "auto", "staged" or "legacy". Nothing was sent.`,
    );
  }

  // 1. Build the manifest and fail early on any local problem.
  let manifest;
  try {
    manifest = buildManifest(repoRoot);
  } catch (err) {
    if (err instanceof BuildError) {
      throw new IngestFailure(BUILD_ERROR_IDS[err.code] ?? "E18", `${err.message} Nothing was sent.`);
    }
    throw new IngestFailure("E18", `Could not read the site: ${messageOf(err)} Nothing was sent.`);
  }
  const { pages, images } = manifest;

  for (const image of images) {
    if (image.size > MAX_IMAGE_BYTES) {
      throw new IngestFailure(
        "E1",
        `Image "${image.relativePath}" is ${image.size} bytes; the limit is 4,000,000 bytes (about 4 MB). Make the image smaller, then push again. Nothing was sent.`,
      );
    }
  }
  if (images.length > MAX_MANIFEST_ENTRIES) {
    throw new IngestFailure(
      "E5",
      `This site has ${images.length} images; at most 2,000 can be published at once. Remove some, then push again. Nothing was sent.`,
    );
  }

  const distinct = new Map(); // sha256 -> { key, size, file } of the first manifest key with that hash
  let totalBytes = 0;
  for (const image of images) {
    totalBytes += image.size;
    if (!distinct.has(image.sha256)) {
      distinct.set(image.sha256, { key: image.manifestKey, size: image.size, file: image.file });
    }
  }
  log(
    images.length === 0
      ? `Built ${pages.length} page(s) and 0 image(s).`
      : `Built ${pages.length} page(s) and ${images.length} image(s): ${distinct.size} distinct, ${formatBytes(totalBytes)}.`,
  );

  // 2. Choose the transport on the exact serialized legacy size.
  const legacyBytes = legacyBodyBytes(pages, images);
  let chosen;
  if (mode === "legacy") {
    if (legacyBytes > MAX_REQUEST_BYTES) {
      throw new IngestFailure(
        "E7",
        `Transport "legacy" was requested, but the site is ${formatBytes(legacyBytes)} as one request and the limit is 4.0 MB. Use transport "auto" or "staged". Nothing was sent.`,
      );
    }
    chosen = "legacy";
  } else if (mode === "staged") {
    chosen = "staged";
  } else {
    chosen = legacyBytes <= MAX_REQUEST_BYTES ? "legacy" : "staged";
  }

  if (chosen === "legacy") {
    log(`Sending the site as one request (${formatBytes(legacyBytes)} of the 4.0 MB allowed).`);
    return runLegacy(ctx, { base, manifest });
  }
  log(
    mode === "staged"
      ? "Staged ingest was requested, so images are sent one at a time."
      : `The site is ${formatBytes(legacyBytes)} as one request, over the 4.0 MB limit, so images are sent one at a time.`,
  );
  return runStaged(ctx, { base, manifest, distinct });
}

async function runLegacy(ctx, { base, manifest }) {
  const body = JSON.stringify(legacyBundleFromManifest(manifest));
  if (Buffer.byteLength(body) > MAX_REQUEST_BYTES) {
    // legacyBodyBytes is exact, so this is a bug in this tool, not in the site.
    throw new Error("the legacy request is larger than its computed size");
  }
  const reply = await send(ctx, {
    step: "ingest",
    url: base,
    headers: { "content-type": "application/json" },
    body,
  });
  if (reply.status === "already_current") {
    reportAlreadyCurrent(ctx.log, reply);
    return { outcome: "already_current", transport: "legacy", uploaded: 0, reused: 0 };
  }
  if (reply.status !== "ingested") throw notUnderstood("ingest", 200, JSON.stringify(reply));
  reportIngested(ctx, "ingest", reply);
  return { outcome: "ingested", transport: "legacy", uploaded: 0, reused: 0 };
}

async function runStaged(ctx, { base, manifest, distinct }) {
  const { pages, images } = manifest;

  // Local checks that belong to the staged requests, still before anything is sent.
  for (const image of images) {
    if (!validateManifestKey(image.manifestKey)) {
      throw new IngestFailure(
        "E17",
        `Image "${image.relativePath}" has a name the platform cannot accept ("${image.manifestKey}"): image names must be 1 to ${MANIFEST_KEY_MAX} characters with no control characters. Rename the file, then push again. Nothing was sent.`,
      );
    }
  }
  const commitBody = JSON.stringify({
    schemaVersion: 1,
    pages,
    images: images.map((image) => ({ manifestKey: image.manifestKey, sha256: image.sha256 })),
  });
  const commitBytes = Buffer.byteLength(commitBody);
  if (commitBytes > MAX_REQUEST_BYTES) {
    throw new IngestFailure(
      "E6",
      `The page content is ${commitBytes} bytes; one request is limited to 4,000,000 bytes. Shorten or remove some pages, then push again. Nothing was sent.`,
    );
  }

  const staged = { transport: "staged" };
  const protocolHeaders = { [PROTOCOL_HEADER]: PROTOCOL };

  // Step 1: the plan.
  ctx.log(
    distinct.size === 0
      ? "Checking whether the platform already has this commit."
      : `Checking which of the ${distinct.size} distinct image(s) the platform still needs.`,
  );
  const plan = await send(ctx, {
    step: "plan",
    url: `${base}${PATHS.plan}`,
    headers: { "content-type": "application/json", ...protocolHeaders },
    body: JSON.stringify({
      images: [...distinct].map(([sha256, entry]) => ({ sha256, size: entry.size })),
    }),
  });
  if (plan.status === "already_current") {
    reportAlreadyCurrent(ctx.log, plan);
    return { outcome: "already_current", ...staged, uploaded: 0, reused: 0 };
  }
  if (
    plan.status !== "planned" ||
    !Array.isArray(plan.missing) ||
    !plan.missing.every((hash) => typeof hash === "string" && distinct.has(hash))
  ) {
    throw notUnderstood("plan", 200, JSON.stringify(plan));
  }
  const missing = new Set(plan.missing);
  const reused = distinct.size - missing.size;
  if (distinct.size === 0) ctx.log("This site has no images to send.");
  else if (missing.size === 0) ctx.log(`All ${distinct.size} image(s) are already on the platform; nothing to upload.`);
  else ctx.log(`${reused} already on the platform; ${missing.size} to upload.`);

  // Step 2: upload what is missing, one image per request, in manifest-key order.
  let uploaded = 0;
  for (const [sha256, entry] of distinct) {
    if (!missing.has(sha256)) continue;
    const reply = await send(ctx, {
      step: "upload",
      key: entry.key,
      url: `${base}${PATHS.images}`,
      headers: {
        "content-type": "application/octet-stream",
        ...protocolHeaders,
        [HASH_HEADER]: sha256,
      },
      body: readFileSync(entry.file),
    });
    if (reply.status === "already_current") {
      reportAlreadyCurrent(ctx.log, reply);
      return { outcome: "already_current", ...staged, uploaded, reused };
    }
    if (reply.status !== "stored" || reply.sha256 !== sha256) {
      throw notUnderstood("upload", 200, JSON.stringify(reply));
    }
    uploaded += 1;
    ctx.log(`Uploaded ${uploaded} of ${missing.size}: "${entry.key}" (${formatBytes(entry.size)}).`);
  }

  // Step 3: the commit. Only now does the site change.
  ctx.log(`Publishing ${pages.length} page(s) and ${images.length} image reference(s).`);
  const reply = await send(ctx, {
    step: "commit",
    url: `${base}${PATHS.commit}`,
    headers: { "content-type": "application/json", ...protocolHeaders },
    body: commitBody,
  });
  if (reply.status === "already_current") {
    reportAlreadyCurrent(ctx.log, reply);
    return { outcome: "already_current", ...staged, uploaded, reused };
  }
  if (reply.status !== "ingested") throw notUnderstood("commit", 200, JSON.stringify(reply));
  reportIngested(ctx, "commit", reply);
  ctx.log(`Sent ${uploaded} new image(s); ${reused} already on the platform.`);
  return { outcome: "ingested", ...staged, uploaded, reused };
}

/**
 * The entry point for actions/github-script: wires `core.getIDToken` and
 * `core.info`, and turns any failure into `core.setFailed(message)` (never a
 * throw, so the run log shows the sentence rather than a stack).
 */
export async function runFromGithubScript({ core, repoRoot, ingestUrl, audience, transport, fetch, sleep }) {
  try {
    return await runIngest({
      repoRoot,
      ingestUrl,
      transport,
      getToken: () => core.getIDToken(audience),
      fetch,
      sleep,
      log: (line) => core.info(line),
    });
  } catch (err) {
    if (err instanceof IngestFailure) {
      core.setFailed(err.message);
    } else {
      core.setFailed(
        `Unexpected error in the ingest tool: ${messageOf(err)}. Re-run this job; if it keeps failing, contact PresbyPortal support.`,
      );
    }
    return undefined;
  }
}
