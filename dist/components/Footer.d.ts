import type { ReactElement } from "react";
import type { RenderSiteBundleProfile } from "../types";
import type { NavEntry } from "./Nav";
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
}
export declare function Footer({ profile, headingClassName, entries, logoUrl, logoAlt, organizationName, }: FooterProps): ReactElement | null;
