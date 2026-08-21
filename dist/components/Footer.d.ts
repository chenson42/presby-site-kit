import type { ReactElement } from "react";
import type { RenderSiteBundleProfile } from "../types";
export interface FooterProps {
    /** `null` renders nothing at all — same null-safe-by-construction
     * discipline as `brand`. When non-null, every individual piece (address,
     * phone, service times, office hours, social links) is independently
     * omitted when its own field is empty; this per-field omissibility is a
     * hard requirement, not a nicety. */
    profile: RenderSiteBundleProfile | null;
    headingClassName?: string;
}
/**
 * Footer chrome, composed automatically by `renderSiteBundle()` below every
 * page's blocks — not a content block itself, since every page needs it.
 * Reads `profile` directly, the same as the `serviceTimes` block.
 */
export declare function Footer({ profile, headingClassName }: FooterProps): ReactElement | null;
