import { type ReactElement } from "react";
export interface NavEntry {
    path: string;
    label: string;
    href: string;
    /**
     * A dropdown group name ("Visit", "Connect", "Serve" for the reference
     * site) -- entries sharing a group render under one hover-opening
     * `<details>` in `Nav` and one link column in `Footer`. `null` is a
     * top-level, ungrouped item (the reference's own "Home").
     */
    group: string | null;
    /** Renders as a filled pill button rather than a plain link -- the
     * reference site's own "Give" link. */
    highlight: boolean;
}
export interface NavProps {
    entries: NavEntry[];
    currentPath: string;
    portalUrl: string | null;
    /** An already-resolved logo image URL, or `null` for the typographic
     * fallback (the caller's own org name, same null-safe discipline as
     * `brand`). */
    logoUrl: string | null;
    logoAlt: string;
    organizationName: string;
    organizationHomeUrl: string;
    /** The reference site's own "Join us Sundays at 10:15 AM" line -- shown
     * inline with the menu at wide viewports, omitted entirely when unset. */
    promoText: string | null;
}
/**
 * Top navigation chrome. Two independently-gated pieces, same discipline as
 * before: the page links (nothing with fewer than two navigable entries)
 * and the member-portal login link. The whole element renders `null` only
 * when both are absent AND there's no logo/org name to show (a page with
 * zero nav entries and no portal link still needs its own home link).
 *
 * Grouped entries (`group` non-null) render as a `<details>` dropdown,
 * opened two ways: hover, via a REAL DOM `open` attribute toggled by
 * `onPointerEnter`/`onPointerLeave` gated to `pointerType === "mouse"`
 * (never a CSS `:hover` rule -- Chromium applies `content-visibility` to
 * `::details-content`, which hides a CLOSED `<details>`'s content from
 * author CSS entirely; a `:hover`-only reveal computes as visible but
 * paints nothing, a gap that only shows up in a real screenshot, not a
 * computed-style check); and click/tap, which flips `open` directly and
 * is what makes the same markup work with no pointer at all.
 */
export declare function Nav({ entries, currentPath, portalUrl, logoUrl, logoAlt, organizationName, organizationHomeUrl, promoText, }: NavProps): ReactElement | null;
