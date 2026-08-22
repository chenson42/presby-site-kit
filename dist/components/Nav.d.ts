import type { ReactElement } from "react";
import type { SiteKitPage } from "../types";
export interface NavProps {
    pages: SiteKitPage[];
    currentPath: string;
    /** presby's own URL builder — this package never assumes a `/site/<slug>`
     * prefix, the same reasoning `imageUrl` already applies to asset links. */
    pageUrl: (path: string) => string;
    /**
     * The member portal's own sign-in entry point (presby's `/o/<slug>`) —
     * `null`-safe by construction like `brand`/`profile`, and a genuinely
     * different URL scheme than `pageUrl` builds, so this package takes it as
     * a plain string rather than trying to derive it from `pageUrl` itself.
     * An unauthenticated visitor hitting this URL is presby's own Edge gate's
     * job to bounce to sign-in with the right callback — this package only
     * ever links to it, never decides who's signed in.
     */
    portalUrl: string | null;
}
/**
 * Top navigation chrome, composed automatically by `renderSiteBundle()`
 * above every page's blocks — not a content block itself, since it needs
 * the whole bundle's page list, not one page's own props.
 *
 * Two independently-gated pieces: the page links (nothing at all with fewer
 * than two navigable pages — a single-page site has nothing meaningful to
 * navigate between, the same "omit the section entirely, never a blank
 * placeholder" discipline `Footer` already follows) and the member-portal
 * login link (shown whenever `portalUrl` is set, regardless of how many
 * public pages exist — a one-page site still has members who need to sign
 * in). The whole element renders `null` only when both are absent.
 */
export declare function Nav({ pages, currentPath, pageUrl, portalUrl }: NavProps): ReactElement | null;
