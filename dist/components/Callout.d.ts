import type { ReactElement } from "react";
/**
 * WCAG relative luminance. The reference site authors two visually distinct
 * "colored band" sections with the SAME component (its own bg-color-teal and
 * bg-color-light-green section variants) -- one dark (white text), one a
 * pale tint of the same hue (dark text). There's no single "inset = white
 * text" rule that covers both; computing luminance from the actual
 * `background` hex and picking accordingly is the one rule that produces
 * the right answer for both without per-block manual overrides.
 */
export interface CalloutProps {
    heading: string;
    /** Markdown source, rendered through the constrained markdown-to-React
     * path in ../markdown.tsx. */
    body: string;
    imageUrl?: string;
    imageAlt?: string;
    /** Optional: the reference site's own "Stay in touch" callout has no
     * button at all, just the image and text. */
    cta?: {
        label: string;
        href: string;
    };
    headingClassName?: string;
    /**
     * `"split"` (default): a two-column image/content layout, the original
     * shape. `"inset"`: a full-bleed color band (the reference's own
     * "Need medical equipment?" section) with the content centered inside
     * a `max()`-clamped inline padding, matching the site's own container
     * model rather than the page's normal content width.
     */
    variant?: "split" | "inset";
    /** Which side the image renders on, in BOTH variants -- the reference
     * alternates this per section ("Stay in touch"'s photo is on the
     * left, "Roger"'s portrait on the worship page is on the right).
     * Defaults to "left". */
    imageSide?: "left" | "right";
    /** An already-validated `#rrggbb` (see `asHexColor` in ../utils) --
     * `inset` only. Unset renders the caller's own default surface color. */
    background?: string;
    /** An already-validated `#rrggbb`, applied to the heading only. */
    headingColor?: string;
}
export declare function Callout({ heading, body, imageUrl, imageAlt, cta, headingClassName, variant, imageSide, background, headingColor, }: CalloutProps): ReactElement;
