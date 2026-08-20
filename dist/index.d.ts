import type { ReactElement } from "react";
/**
 * presby-site-kit — v0.0.1-stub.
 *
 * This is a STUB release, per DECISION-086 (docs/work-log/2026-08-20-public-
 * sites.md, presby's own repository, Phase 3 "presby-site-kit consumability
 * & Phase 4 sequencing"). It exists so presby's public-site render path
 * (`(public)/site/[slug]/page.tsx`) has a real, npm-resolvable dependency to
 * build and test against, not a locally-shadowed fake. It deliberately does
 * NOT parse `mdxAst`, does NOT implement a component allowlist, and does NOT
 * render real congregation content — it renders each page's front-matter
 * `title` (if present) plus a placeholder. A later, separate release of this
 * package (tagged v1.0.0+) builds the real MDX component library (Hero,
 * ServiceTimes, StaffList, EventList, SermonEmbed, ContactForm, DonateLink,
 * and base MDX prose); presby's consuming code does not change shape when
 * that happens, only the pinned tag in presby's own package.json.
 *
 * NO REAL DATA. This repository's own fixtures, examples, and tests must
 * never contain a real congregation name, person, address, or credential —
 * the same invariant presby's own CLAUDE.md states for itself, restated here
 * explicitly rather than assumed to carry over by proximity (presby's own
 * Phase 1 Gap 9). The per-org content repos this package's consumers
 * (site-<slug>) create are the deliberate, explicit exception — real
 * congregation content lives there, never here.
 */
export interface SiteKitPage {
    /** e.g. "/", "/about", "/staff" — the bundle's own routing. */
    path: string;
    /** Opaque to this stub — validated upstream by a content repo's own CI. */
    frontMatter: Record<string, unknown>;
    /** Opaque to this stub — a v1.0.0+ release parses this; this stub never does. */
    mdxAst: unknown;
}
export interface SiteKitTypePairing {
    /** Applied to the element (or an ancestor) that sets the body face. */
    bodyClassName: string;
    /** Applied to the element (or an ancestor) that sets the heading face. */
    headingClassName: string;
}
export interface SiteKitBrand {
    /** Opaque to this stub — the caller's own brand-token shape. Never read
     * directly here; brand rides entirely through re-declared CSS custom
     * properties the caller already emits (its own <BrandTokens>), not through
     * this package inspecting token values. */
    tokens: unknown;
    fontPairing: SiteKitTypePairing;
}
export interface RenderSiteBundleInput {
    pages: SiteKitPage[];
    /** The sub-route within this site's bundle to render, e.g. "/". */
    currentPath: string;
    /** `null` renders with no font-pairing class applied. */
    brand: SiteKitBrand | null;
    /**
     * The caller's own content-addressed asset URL builder. This package NEVER
     * touches a blob store, a filesystem, or raw image bytes directly — every
     * image reference resolves through this closure, which the caller (presby)
     * constructs from its own manifestKey -> blobKey map.
     */
    imageUrl: (manifestKey: string) => string;
}
/**
 * Renders the page in `input.pages` whose `path` matches
 * `input.currentPath`. Returns `null` when no such page exists — the
 * caller's own contract (presby's `page.tsx`) treats `null` as "call
 * notFound()", exactly the same enumeration-safe collapse presby's own
 * `getPublishedSite()` already applies one layer up.
 *
 * Ignores `mdxAst` and every field of `frontMatter` except `title`,
 * deliberately — see this module's own header comment. `imageUrl` is
 * accepted (part of the real, stable signature) but unused by this stub;
 * a v1.0.0+ release calls it from within its own Hero/gallery components.
 */
export declare function renderSiteBundle(input: RenderSiteBundleInput): ReactElement | null;
