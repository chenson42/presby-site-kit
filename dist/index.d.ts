import { type ReactElement } from "react";
import type { RenderSiteBundleProfile, SiteKitPage } from "./types";
export type { SiteKitPage } from "./types";
/**
 * presby-site-kit — v1.0.0.
 *
 * presby's shared public-site rendering shell. presby's public-site render
 * path (`(public)/site/[slug]/page.tsx`) imports `renderSiteBundle()` and
 * nothing else from this package — everything else exported here is the
 * component library that entry point renders against, exposed for direct
 * testing and documentation, not a second integration surface.
 *
 * v1.0.0 replaces the v0.0.1-stub's "ignore mdxAst, render a placeholder"
 * behavior with the real architecture: each page's `mdxAst` carries a typed
 * `{ blocks: ContentBlock[] }` array (see ./types.ts), and `renderSiteBundle`
 * looks each block's `type` up against a **fixed component allowlist**
 * (./blocks.tsx) — an unrecognized type is skipped, never thrown, never
 * executed. This is the trust boundary DESIGN-v1-components.md exists to
 * draw: a content repo is a lower trust tier than presby's own code, so a
 * content repo can ship data this package's own, trusted component set
 * chooses how to draw, but never code presby's server executes.
 *
 * NO REAL DATA. This repository's own fixtures, examples, and tests must
 * never contain a real congregation name, person, address, or credential —
 * the same invariant presby's own CLAUDE.md states for itself, restated here
 * explicitly rather than assumed to carry over by proximity. The per-org
 * content repos this package's consumers (site-<slug>) create are the
 * deliberate, explicit exception — real congregation content lives there,
 * never here.
 */
export interface SiteKitTypePairing {
    /** Applied to the element (or an ancestor) that sets the body face. */
    bodyClassName: string;
    /** Applied to the element (or an ancestor) that sets the heading face. */
    headingClassName: string;
}
export interface SiteKitBrand {
    /** Opaque to this package — the caller's own brand-token shape. Never read
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
    /**
     * presby's own URL builder for a bundle-relative page path (e.g. "/",
     * "/about") — the same reasoning as `imageUrl`: this package never
     * assumes a `/site/<slug>` prefix or any other URL scheme. Used by `Nav`.
     */
    pageUrl: (path: string) => string;
    /**
     * The member portal's sign-in entry point (presby's `/o/<slug>`) — a
     * genuinely different URL scheme than `pageUrl` builds, so this is a
     * plain string, not derived from it. `null` renders `Nav`'s "Member
     * Login" link as absent, the same null-safe-by-construction discipline
     * as `brand`/`profile`.
     */
    portalUrl: string | null;
    /**
     * The organization-level profile fields presby's own schema supplies
     * (address, phone, social links, service times, office hours). `null`
     * renders every profile-driven surface (the `serviceTimes` block, the
     * `Footer` chrome) as absent — the same null-safe-by-construction
     * discipline as `brand`, not an exception to it. See
     * DESIGN-v1-components.md's "Org-profile data dependency".
     */
    profile: RenderSiteBundleProfile | null;
}
/**
 * Renders the page in `input.pages` whose `path` matches
 * `input.currentPath`. Returns `null` when no such page exists — the
 * caller's own contract (presby's `page.tsx`) treats `null` as "call
 * notFound()", exactly the same enumeration-safe collapse presby's own
 * `getPublishedSite()` already applies one layer up.
 *
 * For a matched page, iterates `mdxAst.blocks`, looks each block's `type`
 * up against `ALLOWED_BLOCK_TYPES`, and renders the matching component with
 * its (defensively validated) `props`. An unrecognized `type`, or a block
 * whose required props are missing/malformed, is skipped — never thrown —
 * so one bad block never takes down the rest of the page. `Footer` chrome
 * is composed automatically below every page's blocks, reading `profile`
 * directly; it is not a block type itself, since every page needs it.
 */
export declare function renderSiteBundle(input: RenderSiteBundleInput): ReactElement | null;
export { ALLOWED_BLOCK_TYPES } from "./blocks";
export type { ContentBlock, RenderSiteBundleProfile, ScheduleEntry, SocialLink } from "./types";
export { Callout } from "./components/Callout";
export type { CalloutProps } from "./components/Callout";
export { DonateLink } from "./components/DonateLink";
export type { DonateLinkProps } from "./components/DonateLink";
export { EventList } from "./components/EventList";
export type { EventListEvent, EventListProps } from "./components/EventList";
export { FeatureGrid } from "./components/FeatureGrid";
export type { FeatureGridItem, FeatureGridProps } from "./components/FeatureGrid";
export { Footer } from "./components/Footer";
export type { FooterProps } from "./components/Footer";
export { Hero } from "./components/Hero";
export type { HeroProps } from "./components/Hero";
export { MinistryList } from "./components/MinistryList";
export type { MinistryListItem, MinistryListProps } from "./components/MinistryList";
export { Nav } from "./components/Nav";
export type { NavProps } from "./components/Nav";
export { Prose } from "./components/Prose";
export type { ProseProps } from "./components/Prose";
export { ServiceTimes } from "./components/ServiceTimes";
export type { ServiceTimesProps } from "./components/ServiceTimes";
export { SermonEmbed } from "./components/SermonEmbed";
export type { SermonEmbedProps } from "./components/SermonEmbed";
export { StaffList } from "./components/StaffList";
export type { StaffPerson, StaffListProps } from "./components/StaffList";
export { ValuesGrid } from "./components/ValuesGrid";
export type { ValuesGridItem, ValuesGridProps } from "./components/ValuesGrid";
