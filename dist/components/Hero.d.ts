import type { ReactElement } from "react";
export interface HeroProps {
    eyebrow?: string;
    heading: string;
    tagline?: string;
    body?: string;
    /** An already-resolved image URL — the block engine resolves the
     * authored `image` manifestKey through the caller's `imageUrl` closure
     * before this component ever sees it (see ../blocks.tsx). */
    imageUrl?: string;
    /** Not in the design note's original prop table; added so a real image
     * isn't forced to be decorative. Falls back to empty alt (decorative)
     * when omitted — see this package's report for the rationale. */
    imageAlt?: string;
    cta?: {
        label: string;
        href: string;
    };
    headingClassName?: string;
}
export declare function Hero({ eyebrow, heading, tagline, body, imageUrl, imageAlt, cta, headingClassName, }: HeroProps): ReactElement;
