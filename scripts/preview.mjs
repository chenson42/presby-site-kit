#!/usr/bin/env node
// preview.mjs — a local preview server for a site content repo.
//
// Run from a content repo (the folder holding content/ and images/):
//   npx presby-site-preview            (http://localhost:4000)
//   npx presby-site-preview --port 4100 --offline
//
// What it is: the SAME renderer the platform uses (renderSiteBundle(), this
// package's dist/), fed the repo's own content/ and images/ through the SAME
// builder the publish workflow uses (build-bundle.mjs's buildManifest), so a
// file the publish would refuse is refused here with the same message.
//
// What it is not: the platform. Live slots (leadership, calendar, giving,
// careers) and the contact form are labelled placeholders, because their data
// lives in PresbyPortal. Colours and fonts are borrowed from the live site's
// own stylesheets (--live-site, or preview.json's liveSite), which carry the
// church's current Branding; with --offline, or if the live site can't be
// reached, this package's own styles.css and neutral default colours stand in.
// Carousels show their first slide only (no client JavaScript is shipped);
// the phone menu toggle works through a small inline script.
//
// Diagnostics: a panel at the foot of each page lists every block that was
// skipped (unknown type, or required props missing), every image key with no
// file behind it, oversize images and reserved page names. The real site
// skips those silently; the preview names them.
//
// Optional preview.json at the repo root (none of it is published):
//   { "organizationName": "Pasture Church",
//     "liveSite": "https://www.pasturechurch.org",
//     "portalUrl": "https://www.presbyportal.org/o/pasturechurch",
//     "profile": { "address": null, "phone": null, "socialLinks": [],
//                  "serviceTimes": [{ "dayOfWeek": 0, "startTime": "10:00",
//                                     "endTime": "11:00", "label": "Worship" }],
//                  "officeHours": [] } }
//
// Listens on 127.0.0.1 only. Serves image files by manifest key only, never
// by path, so nothing outside images/ is reachable.

import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildManifest, walkFiles } from "./build-bundle.mjs";

const require = createRequire(import.meta.url);

/** The platform's per-image limit (presby's MAX_IMAGE_BYTES). */
export const MAX_IMAGE_BYTES = 4_000_000;
/** presby's RESERVED_SITE_SEGMENTS and RESERVED_SITE_DESCENDANTS. */
const RESERVED_SEGMENTS = ["give", "assets", "robots.txt", "sitemap.xml"];
const RESERVED_DESCENDANTS = ["careers"];
/** presby's render-site-page.tsx portal-link constants. */
const PORTAL_NAV_GROUP = "Connect";
const PORTAL_LABEL = "Our Portal";
const PORTAL_NAV_ORDER = 23;

const LIVE_SLOT_INFO = {
  staffDirectory: {
    title: "Leadership (live from PresbyPortal)",
    body: "Staff and officers the church has marked “List publicly”, with photos.",
  },
  committeeDirectory: {
    title: "Committees (live from PresbyPortal)",
    body: "Committees and their publicly listed members.",
  },
  eventsCalendar: {
    title: "Events calendar (live from PresbyPortal)",
    body: "The church's public events, as a list or a month grid.",
  },
  giving: {
    title: "Online giving form (live from PresbyPortal)",
    body: "Amount, fund, one-time or monthly, then Stripe's secure checkout.",
  },
  careers: {
    title: "Job openings (live from PresbyPortal)",
    body: "Open positions the church has published.",
  },
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function reservedSegment(pagePath) {
  const segments = pagePath.toLowerCase().split("/").filter((s) => s !== "");
  const first = segments[0];
  if (!first) return null;
  if (RESERVED_SEGMENTS.includes(first)) return first;
  if (segments.length > 1 && RESERVED_DESCENDANTS.includes(first)) return first;
  return null;
}

export function readConfig(repoRoot) {
  const file = path.join(repoRoot, "preview.json");
  if (!statSync(file, { throwIfNoEntry: false })) return {};
  try {
    const parsed = JSON.parse(readFileSync(file, "utf-8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    throw new Error(`Malformed JSON in preview.json: ${err.message}`);
  }
}

/**
 * Pulls what the preview borrows from a live page: its stylesheets (made
 * absolute), its inline <style> blocks (the church's brand colours), the
 * <body> class (the font), and the brand font-pairing classes on the site
 * wrapper and headings. Pure; exported for tests.
 */
export function extractLiveStyles(html, baseUrl) {
  const stylesheets = [];
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (!/\brel=["']?stylesheet/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (href) stylesheets.push(new URL(href.replace(/&amp;/g, "&"), baseUrl).toString());
  }
  const inlineStyles = html.match(/<style\b[^>]*>[\s\S]*?<\/style>/gi) ?? [];
  const bodyClass = html.match(/<body\b[^>]*\bclass=["']([^"']*)["']/i)?.[1] ?? "";
  const siteClass = html.match(/<div\b[^>]*\bclass=["']presby-site\b([^"']*)["']/i)?.[1]?.trim() ?? "";
  const headingClass =
    html.match(/<h[1-3]\b[^>]*\bclass=["']([^"']*_className[^"']*)["']/i)?.[1] ?? "";
  return { stylesheets, inlineStyles, bodyClass, siteClass, headingClass };
}

async function fetchLiveStyles(liveSite) {
  const res = await fetch(new URL("/", liveSite), { redirect: "follow", signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${liveSite} answered ${res.status}`);
  const styles = extractLiveStyles(await res.text(), res.url);
  if (styles.stylesheets.length === 0) throw new Error(`no stylesheets found at ${liveSite}`);
  return styles;
}

const OFFLINE_ROOT = `<style>:root{--background:#ffffff;--foreground:#1c1917;--primary:#3f6b3a;--primary-foreground:#ffffff;--secondary:#f1f5ef;--muted:#f4f4f5;--muted-foreground:#57534e;--border:#e7e5e4;--card:#ffffff;--card-foreground:#1c1917;--radius:0.5rem}
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--foreground);background:var(--background)}</style>`;

function liveSlotPlaceholder(React, slot, filter) {
  const info = LIVE_SLOT_INFO[slot];
  const filterText = Object.keys(filter).length ? ` Filter: ${JSON.stringify(filter)}` : "";
  return React.createElement(
    "section",
    {
      "data-preview": "live-slot",
      style: {
        margin: "1.5rem auto",
        maxWidth: "64rem",
        padding: "1.25rem",
        border: `2px dashed ${info ? "#94a3b8" : "#dc2626"}`,
        borderRadius: "0.75rem",
        background: info ? "#f8fafc" : "#fef2f2",
        color: "#334155",
        fontFamily: "system-ui, sans-serif",
      },
    },
    React.createElement("strong", null, info ? info.title : `Unknown live slot "${slot}"`),
    React.createElement(
      "p",
      { style: { margin: "0.5rem 0 0" } },
      (info ? info.body : "The real site shows nothing here. Check the slot name in BUILDING.md.") + filterText,
    ),
  );
}

function contactFormPlaceholder(React) {
  return React.createElement(
    "div",
    {
      "data-preview": "contact-form",
      style: {
        padding: "1.25rem",
        border: "2px dashed #94a3b8",
        borderRadius: "0.75rem",
        background: "#f8fafc",
        color: "#334155",
        fontFamily: "system-ui, sans-serif",
      },
    },
    "Contact form (provided by PresbyPortal): name, email, message, spam check, Send.",
  );
}

/**
 * Renders one page of the repo at `requestPath`. Returns
 * { status, title, html, diagnostics }. Re-reads content/ and images/ on
 * every call, so a refresh always shows what is on disk.
 */
export function renderPreview(repoRoot, requestPath, options = {}) {
  const React = require("react");
  const { renderToStaticMarkup } = require("react-dom/server");
  const kit = require("../dist/index.js");

  const config = options.config ?? readConfig(repoRoot);
  const live = options.liveStyles ?? null;
  const { pages, images } = buildManifest(repoRoot);
  const diagnostics = [];

  const imageKeys = new Map(images.map((image) => [image.manifestKey, image]));
  for (const image of images) {
    if (image.size > MAX_IMAGE_BYTES) {
      diagnostics.push(
        `Image "${image.relativePath}" is ${(image.size / 1_000_000).toFixed(1)} MB. The limit is 4 MB, and the publish will stop on it.`,
      );
    }
  }
  for (const page of pages) {
    const reserved = reservedSegment(page.path);
    if (reserved) {
      diagnostics.push(`Page "${page.path}" uses the reserved name "/${reserved}". The publish will refuse it; rename the file.`);
    }
  }

  const missingImages = new Set();
  const imageUrl = (key) => {
    if (!imageKeys.has(key)) missingImages.add(key);
    return `/__preview/images/${encodeURIComponent(key)}`;
  };
  const brand =
    live && (live.siteClass || live.headingClass)
      ? { tokens: null, fontPairing: { bodyClassName: live.siteClass, headingClassName: live.headingClass } }
      : null;
  const liveSlots = new Proxy(
    {},
    {
      get: (_target, slot) =>
        typeof slot === "string" ? (filter) => liveSlotPlaceholder(React, slot, filter) : undefined,
    },
  );
  const baseInput = {
    organizationName: config.organizationName ?? "Your church",
    origin: config.liveSite,
    brand,
    profile: config.profile ?? null,
    imageUrl,
    pageUrl: (p) => p,
    logoUrl: null,
    portalUrl: config.portalUrl ?? null,
    portalNavGroup: PORTAL_NAV_GROUP,
    portalLabel: PORTAL_LABEL,
    portalNavOrder: PORTAL_NAV_ORDER,
    contactForm: contactFormPlaceholder(React),
    liveSlots,
  };

  const page = pages.find((p) => p.path === requestPath);
  if (!page) {
    return { status: 404, title: "Page not found", html: notFoundHtml(requestPath, pages), diagnostics };
  }

  // Which blocks skipped themselves: render each block alone and compare
  // with the page rendered with no blocks at all.
  const blocks = Array.isArray(page.mdxAst?.blocks) ? page.mdxAst.blocks : [];
  const renderBlocks = (list) =>
    renderToStaticMarkup(
      kit.renderSiteBundle({
        ...baseInput,
        pages: pages.map((p) => (p === page ? { ...p, mdxAst: { blocks: list } } : p)),
        currentPath: page.path,
      }),
    );
  const empty = renderBlocks([]);
  blocks.forEach((block, i) => {
    const label = `Block ${i + 1}`;
    if (!block || typeof block !== "object" || typeof block.type !== "string") {
      diagnostics.push(`${label} has no "type", so it is skipped.`);
      return;
    }
    if (!kit.ALLOWED_BLOCK_TYPES.includes(block.type)) {
      diagnostics.push(`${label} ("${block.type}") is not a block type, so it is skipped. See BUILDING.md for the list.`);
      return;
    }
    if (block.type === "liveSlot" && !(block.props?.slot in LIVE_SLOT_INFO)) {
      diagnostics.push(`${label} (liveSlot) names slot "${block.props?.slot}", which doesn't exist, so the real site shows nothing there.`);
      return;
    }
    if (block.type === "serviceTimes") {
      if (!(baseInput.profile?.serviceTimes?.length > 0)) {
        diagnostics.push(
          `${label} (serviceTimes) is empty here because preview.json has no profile.serviceTimes. On the real site it shows the times entered in PresbyPortal, or nothing if none are.`,
        );
      }
      return;
    }
    if (renderBlocks([block]) === empty) {
      diagnostics.push(`${label} ("${block.type}") rendered nothing: a required prop is missing or malformed.`);
    }
  });

  const body = renderToStaticMarkup(kit.renderSiteBundle({ ...baseInput, pages, currentPath: page.path }));
  for (const key of missingImages) {
    diagnostics.push(`Image "${key}" is used on this page but there is no images/${key}.png, .jpg, .jpeg or .webp.`);
  }
  const fm = page.frontMatter ?? {};
  const pageTitle = (typeof fm.title === "string" && fm.title) || (typeof fm.navLabel === "string" && fm.navLabel) || "";
  const title = pageTitle ? `${pageTitle} | ${baseInput.organizationName}` : baseInput.organizationName;
  return { status: 200, title, html: body, diagnostics };
}

function notFoundHtml(requestPath, pages) {
  const list = pages.map((p) => `<li><a href="${escapeHtml(p.path)}">${escapeHtml(p.path)}</a></li>`).join("");
  return `<div style="font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem"><h1>No page at ${escapeHtml(requestPath)}</h1><p>Pages in this repo:</p><ul>${list}</ul></div>`;
}

function diagnosticsPanel(diagnostics, notes) {
  const items = diagnostics.map((d) => `<li>${escapeHtml(d)}</li>`).join("");
  const ok = diagnostics.length === 0;
  return `<aside id="__preview-panel" style="position:fixed;left:0;right:0;bottom:0;z-index:2147483647;max-height:40vh;overflow:auto;font:14px/1.4 system-ui,sans-serif;background:${ok ? "#ecfdf5" : "#fef2f2"};color:#111;border-top:2px solid ${ok ? "#059669" : "#dc2626"};padding:.5rem 1rem">
<details${ok ? "" : " open"}><summary style="cursor:pointer;font-weight:600">${ok ? "Preview: no problems found on this page" : `Preview: ${diagnostics.length} problem${diagnostics.length === 1 ? "" : "s"} on this page`}</summary>
${ok ? "" : `<ul style="margin:.5rem 0">${items}</ul>`}<p style="margin:.25rem 0;color:#444">${escapeHtml(notes)}</p></details></aside>`;
}

const CLIENT_SCRIPT = `<script>
document.addEventListener("click",function(e){var b=e.target.closest('[data-slot="menu-toggle"]');if(!b)return;var m=document.getElementById(b.getAttribute("aria-controls"));if(!m)return;var o=m.getAttribute("data-open")!=="true";m.setAttribute("data-open",String(o));b.setAttribute("aria-expanded",String(o));});
(function(){var v=null;setInterval(function(){fetch("/__preview/version").then(function(r){return r.text()}).then(function(t){if(v!==null&&t!==v)location.reload();v=t}).catch(function(){})},1000)})();
</script>`;

// The platform's pages carry next-themes' pre-paint script, which puts a
// `dark` class on <html> from the system setting; the borrowed stylesheets
// switch on that class. This is the same decision, plus ?theme=light|dark to
// force one. Runs in <head> so the page never flashes the wrong scheme.
const THEME_SCRIPT = `<script>(function(){var r=document.documentElement,q=new URLSearchParams(location.search).get("theme"),m=window.matchMedia("(prefers-color-scheme: dark)");function a(d){r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}a(q?q==="dark":m.matches);if(!q)m.addEventListener("change",function(e){a(e.matches)})})()</script>`;

export function pageDocument(result, live) {
  const head = THEME_SCRIPT + (live
    ? live.stylesheets.map((href) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join("") + live.inlineStyles.join("")
    : `<link rel="stylesheet" href="/__preview/kit.css">${OFFLINE_ROOT}`);
  const notes = live
    ? "Colours and fonts come from the live site, in light or dark to match your system (add ?theme=light or ?theme=dark to force one). Live blocks and the contact form are placeholders; carousels show their first slide. This page reloads when you save."
    : "Offline styles: colours and fonts are approximate. Live blocks and the contact form are placeholders. This page reloads when you save.";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(result.title)} (preview)</title>${head}</head><body class="${escapeHtml(live?.bodyClass ?? "")}"><main class="min-h-screen" style="padding-bottom:4rem">${result.html}</main>${diagnosticsPanel(result.diagnostics, notes)}${CLIENT_SCRIPT}</body></html>`;
}

function errorDocument(message) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Preview error</title></head><body style="font-family:system-ui,sans-serif;max-width:44rem;margin:3rem auto;padding:0 1rem"><h1 style="color:#b91c1c">The publish would fail</h1><p style="white-space:pre-wrap">${escapeHtml(message)}</p><p>Fix the file and save; this page reloads by itself.</p>${CLIENT_SCRIPT}</body></html>`;
}

/** A cheap fingerprint of everything the preview reads, for auto-reload. */
export function contentVersion(repoRoot) {
  const hash = createHash("sha1");
  const files = [
    ...walkFiles(path.join(repoRoot, "content")),
    ...walkFiles(path.join(repoRoot, "images")),
    path.join(repoRoot, "preview.json"),
  ];
  for (const file of files.sort()) {
    const st = statSync(file, { throwIfNoEntry: false });
    if (st) hash.update(`${file}:${st.mtimeMs}:${st.size}\n`);
  }
  return hash.digest("hex");
}

function parseArgs(argv) {
  const args = { port: 4000, dir: process.cwd(), offline: false, liveSite: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--port") args.port = Number(argv[++i]);
    else if (a === "--dir") args.dir = path.resolve(argv[++i]);
    else if (a === "--offline") args.offline = true;
    else if (a === "--live-site") args.liveSite = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
    else throw new Error(`Unknown option ${a}. Try --help.`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("usage: presby-site-preview [--port 4000] [--dir <content repo>] [--live-site <url>] [--offline]");
    return;
  }
  const repoRoot = args.dir;
  if (!statSync(path.join(repoRoot, "content"), { throwIfNoEntry: false })) {
    console.error(`No content/ folder in ${repoRoot}. Run this from the site repo, or pass --dir.`);
    process.exit(1);
  }
  const config = readConfig(repoRoot);
  const liveSite = args.liveSite ?? config.liveSite;
  let live = null;
  if (!args.offline && liveSite) {
    try {
      live = await fetchLiveStyles(liveSite);
      console.log(`Using colours and fonts from ${liveSite}`);
    } catch (err) {
      console.warn(`Couldn't read styles from ${liveSite} (${err.message}); using offline styles.`);
    }
  } else if (!args.offline) {
    console.warn('No liveSite in preview.json and no --live-site; using offline styles.');
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const send = (status, type, body) => {
      res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
      res.end(body);
    };
    try {
      if (url.pathname === "/__preview/version") return send(200, "text/plain", contentVersion(repoRoot));
      if (url.pathname === "/__preview/kit.css") {
        return send(200, "text/css", readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist", "styles.css")));
      }
      if (url.pathname.startsWith("/__preview/images/")) {
        const key = decodeURIComponent(url.pathname.slice("/__preview/images/".length));
        const image = buildManifest(repoRoot).images.find((i) => i.manifestKey === key);
        if (!image) return send(404, "text/plain", "No such image");
        return send(200, image.contentType, readFileSync(image.file));
      }
      const pagePath = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : "/";
      const result = renderPreview(repoRoot, decodeURIComponent(pagePath), { config: readConfig(repoRoot), liveStyles: live });
      for (const d of result.diagnostics) console.warn(`  ${pagePath}: ${d}`);
      return send(result.status, "text/html; charset=utf-8", pageDocument(result, live));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(message);
      return send(500, "text/html; charset=utf-8", errorDocument(message));
    }
  });
  server.listen(args.port, "127.0.0.1", () => {
    console.log(`Previewing ${repoRoot}\nOpen http://localhost:${args.port}  (Ctrl+C to stop)`);
  });
}

const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
