/**
 * Shared types for the v1.0.0 content-block system. See
 * DESIGN-v1-components.md for the architecture rationale (typed blocks, not
 * MDX-with-embedded-JS) and this package's own README for the "no real
 * data" invariant that applies to every fixture in this repo.
 */
/**
 * One page in a site's content bundle. `path` is the bundle's own routing
 * (e.g. "/", "/about") — presby's own render path translates this into a
 * real URL via the `pageUrl` closure it hands `renderSiteBundle()`; this
 * package never assumes a URL prefix.
 */
export interface SiteKitPage {
    path: string;
    /** Opaque to this package — validated upstream by a content repo's own CI
     * and by presby's own `validateBundle()`, which only checks the field's
     * presence, never its shape. A page opts into `Nav` chrome by setting
     * `frontMatter.navLabel` to a non-empty string; unset (or every other
     * key) is ignored. */
    frontMatter: Record<string, unknown>;
    /**
     * Wire-format stable as `unknown` at this interface boundary — narrowed
     * defensively inside `renderSiteBundle()` to `{ blocks: ContentBlock[] }`.
     * A malformed or legacy shape renders no body content for that page,
     * never throws.
     */
    mdxAst: unknown;
}
export interface SocialLink {
    platform: "facebook" | "instagram" | "xTwitter" | "youtube" | "other";
    url: string;
}
/**
 * A recurring weekly schedule entry — a worship service or an office-hours
 * block. `dayOfWeek` follows the same 0 = Sunday .. 6 = Saturday convention
 * as `Date.prototype.getDay()`. `startTime`/`endTime` are plain "HH:MM"
 * 24-hour wall-clock strings with no associated date or timezone — see
 * `formatClockTime()` in `./utils` for why these are never routed through
 * `Date`/`toLocale*`.
 */
export interface ScheduleEntry {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    label: string | null;
}
/**
 * The organization-level profile fields presby's own schema supplies
 * alongside a rendered page — address, phone, social links, and the two
 * weekly schedules. `renderSiteBundle()`'s `profile` input is `null`-safe by
 * construction, the same discipline as its existing `brand` input: every
 * surface this data feeds (the `serviceTimes` block, the `Footer` chrome)
 * renders with that one piece simply absent rather than throwing.
 */
export interface RenderSiteBundleProfile {
    address: string | null;
    phone: string | null;
    socialLinks: SocialLink[];
    serviceTimes: ScheduleEntry[];
    officeHours: ScheduleEntry[];
}
/**
 * One entry in a page's `mdxAst.blocks` array. `type` is checked against
 * `ALLOWED_BLOCK_TYPES` (see `./blocks`) — an unrecognized type is skipped,
 * never rendered, never executed. `props` is intentionally untyped at this
 * boundary; each block renderer in `./blocks` narrows and validates its own
 * subset defensively.
 */
export interface ContentBlock {
    type: string;
    props: Record<string, unknown>;
}
