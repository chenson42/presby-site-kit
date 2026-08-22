import type { ReactElement } from "react";
import type { SiteKitPage } from "../types";
export interface NavProps {
    pages: SiteKitPage[];
    currentPath: string;
    /** presby's own URL builder — this package never assumes a `/site/<slug>`
     * prefix, the same reasoning `imageUrl` already applies to asset links. */
    pageUrl: (path: string) => string;
}
/**
 * Top navigation chrome, composed automatically by `renderSiteBundle()`
 * above every page's blocks — not a content block itself, since it needs
 * the whole bundle's page list, not one page's own props. Renders nothing
 * at all with fewer than two navigable pages: a single-page site has
 * nothing meaningful to navigate between, the same "omit the section
 * entirely, never a blank placeholder" discipline `Footer` already follows.
 */
export declare function Nav({ pages, currentPath, pageUrl }: NavProps): ReactElement | null;
