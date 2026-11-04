// @vitest-environment node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { cleanupFixtures, makeImage, makeSiteRepo } from "./ingest-fixtures";

// preview.mjs is plain JS (like build-bundle.mjs) and renders through the
// built dist/, so these tests exercise exactly what `presby-site-preview` runs.
const preview = (await import("../scripts/preview.mjs")) as {
  renderPreview: (
    repoRoot: string,
    requestPath: string,
    options?: { config?: Record<string, unknown>; liveStyles?: unknown },
  ) => { status: number; title: string; html: string; diagnostics: string[] };
  extractLiveStyles: (
    html: string,
    baseUrl: string,
  ) => { stylesheets: string[]; inlineStyles: string[]; bodyClass: string; siteClass: string; headingClass: string };
  pageDocument: (result: { title: string; html: string; diagnostics: string[] }, live: unknown) => string;
  reservedSegment: (pagePath: string) => string | null;
  contentVersion: (repoRoot: string) => string;
};

afterEach(() => cleanupFixtures());

describe("renderPreview", () => {
  it("renders a page through renderSiteBundle with the org name in the title", () => {
    const repo = makeSiteRepo({
      pages: { "about.json": { frontMatter: { title: "About", navLabel: "About" }, blocks: [{ type: "prose", props: { body: "## Our story" } }] } },
    });
    const result = preview.renderPreview(repo, "/about", { config: { organizationName: "Example Church" } });
    expect(result.status).toBe(200);
    expect(result.title).toBe("About | Example Church");
    expect(result.html).toContain('class="presby-site"');
    expect(result.html).toContain("Our story");
    expect(result.diagnostics).toEqual([]);
  });

  it("names skipped blocks, unknown types, unknown live slots and missing images", () => {
    const repo = makeSiteRepo({
      pages: {
        "broken.json": {
          frontMatter: {},
          blocks: [
            { type: "hero", props: {} },
            { type: "carousel", props: {} },
            { type: "callout", props: { heading: "Hi", body: "Text", image: "no-such-photo" } },
            { type: "liveSlot", props: { slot: "staff" } },
          ],
        },
      },
    });
    const { diagnostics } = preview.renderPreview(repo, "/broken", { config: {} });
    expect(diagnostics).toEqual([
      'Block 1 ("hero") rendered nothing: a required prop is missing or malformed.',
      'Block 2 ("carousel") is not a block type, so it is skipped. See BUILDING.md for the list.',
      'Block 4 (liveSlot) names slot "staff", which doesn\'t exist, so the real site shows nothing there.',
      'Image "no-such-photo" is used on this page but there is no images/no-such-photo.png, .jpg, .jpeg or .webp.',
    ]);
  });

  it("renders known live slots and the contact form as placeholders", () => {
    const repo = makeSiteRepo({
      pages: {
        "leaders.json": {
          frontMatter: {},
          blocks: [
            { type: "liveSlot", props: { slot: "staffDirectory", filter: { kind: "staff" } } },
            { type: "contactForm", props: { heading: "Write to us" } },
          ],
        },
      },
    });
    const result = preview.renderPreview(repo, "/leaders", { config: {} });
    expect(result.html).toContain("Leadership (live from PresbyPortal)");
    expect(result.html).toContain("Filter: {&quot;kind&quot;:&quot;staff&quot;}");
    expect(result.html).toContain("Write to us");
    expect(result.html).toContain('data-preview="contact-form"');
    expect(result.diagnostics).toEqual([]);
  });

  it("explains an empty serviceTimes block instead of calling it broken", () => {
    const repo = makeSiteRepo({ pages: { "times.json": { frontMatter: {}, blocks: [{ type: "serviceTimes", props: {} }] } } });
    expect(preview.renderPreview(repo, "/times", { config: {} }).diagnostics[0]).toMatch(/no profile\.serviceTimes/);
    const withTimes = preview.renderPreview(repo, "/times", {
      config: {
        profile: {
          address: null,
          phone: null,
          socialLinks: [],
          serviceTimes: [{ dayOfWeek: 0, startTime: "10:00", endTime: "11:00", label: "Worship" }],
          officeHours: [],
        },
      },
    });
    expect(withTimes.diagnostics).toEqual([]);
  });

  it("flags reserved page names and oversize images the publish would refuse", () => {
    const repo = makeSiteRepo({ images: { "big.jpg": makeImage("jpeg", 4_000_001, 1) } });
    mkdirSync(path.join(repo, "content", "give"), { recursive: true });
    writeFileSync(path.join(repo, "content", "give", "x.json"), JSON.stringify({ frontMatter: {}, blocks: [] }));
    const { diagnostics } = preview.renderPreview(repo, "/", { config: {} });
    expect(diagnostics.some((d) => d.includes('"images/big.jpg"') && d.includes("4 MB"))).toBe(true);
    expect(diagnostics.some((d) => d.includes('"/give/x"') && d.includes('"/give"'))).toBe(true);
  });

  it("returns a 404 listing the pages for an unknown path", () => {
    const repo = makeSiteRepo();
    const result = preview.renderPreview(repo, "/nope", { config: {} });
    expect(result.status).toBe(404);
    expect(result.html).toContain('href="/"');
  });

  it("throws the publish's own message for malformed JSON", () => {
    const repo = makeSiteRepo({ rawPages: { "bad.json": "{bad" } });
    expect(() => preview.renderPreview(repo, "/", { config: {} })).toThrow(/Malformed JSON in .*bad\.json/);
  });
});

describe("extractLiveStyles", () => {
  it("absolutizes stylesheets and keeps inline styles, body and brand classes", () => {
    const html = `<html><head><link rel="stylesheet" href="/_next/a.css" data-precedence="next"/><link rel="preload" href="/x.js"/><style>:root{--primary:#123456}</style></head>
<body class="font_className min-h-screen"><main><div class="presby-site body_className"><section><h2 class="head_className">Hi</h2></section></div></main></body></html>`;
    expect(preview.extractLiveStyles(html, "https://church.example/")).toEqual({
      stylesheets: ["https://church.example/_next/a.css"],
      inlineStyles: ["<style>:root{--primary:#123456}</style>"],
      bodyClass: "font_className min-h-screen",
      siteClass: "body_className",
      headingClass: "head_className",
    });
  });
});

describe("pageDocument", () => {
  it("escapes the title and uses offline styles without a live site", () => {
    const doc = preview.pageDocument({ title: "<x>", html: "<p>ok</p>", diagnostics: ["a <b> problem"] }, null);
    expect(doc).toContain("<title>&lt;x&gt; (preview)</title>");
    expect(doc).toContain('href="/__preview/kit.css"');
    expect(doc).toContain("a &lt;b&gt; problem");
  });

  it("applies the system colour scheme as the platform's dark class, before the body", () => {
    const doc = preview.pageDocument({ title: "t", html: "", diagnostics: [] }, null);
    const head = doc.slice(0, doc.indexOf("</head>"));
    expect(head).toContain('prefers-color-scheme: dark');
    expect(head).toContain('classList.toggle("dark"');
  });
});

describe("helpers", () => {
  it("reservedSegment matches the platform's reserved names", () => {
    expect(preview.reservedSegment("/give")).toBe("give");
    expect(preview.reservedSegment("/careers/x")).toBe("careers");
    expect(preview.reservedSegment("/careers")).toBeNull();
    expect(preview.reservedSegment("/giving")).toBeNull();
  });

  it("contentVersion changes when a content file changes", () => {
    const repo = makeSiteRepo();
    const before = preview.contentVersion(repo);
    writeFileSync(path.join(repo, "content", "new.json"), "{}");
    expect(preview.contentVersion(repo)).not.toBe(before);
  });
});
