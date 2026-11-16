import { type ReactElement } from "react";
import type { RenderSiteBundleProfile } from "../types";
import type { NavEntry } from "./Nav";
import { type FooterLink } from "../site-settings";
export interface FooterProps {
    /** `null` renders nothing at all -- same null-safe-by-construction
     * discipline as `brand`. When non-null, every individual piece is
     * independently omitted when its own field is empty. */
    profile: RenderSiteBundleProfile | null;
    headingClassName?: string;
    /** The same grouped entries `Nav` renders as dropdowns render here as
     * link columns under each group's own heading -- one shared grouping,
     * two presentations, never two independent lists to keep in sync. */
    entries: NavEntry[];
    logoUrl: string | null;
    logoAlt: string;
    organizationName: string;
    /** v4.5.0 site settings (home-page frontMatter `site`); all optional. */
    footerLine?: string | null;
    footerLinks?: FooterLink[];
    /** Replaces "All rights reserved" in the © line when set. */
    copyrightHolder?: string | null;
}
export declare function Footer({ profile, headingClassName, entries, logoUrl, logoAlt, organizationName, footerLine, footerLinks, copyrightHolder, }: FooterProps): ReactElement | null;
