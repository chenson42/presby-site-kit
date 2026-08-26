import { type ReactElement } from "react";
export interface HeroSlide {
    imageUrl: string;
    imageAlt: string;
}
export interface HeroProps {
    eyebrow?: string;
    heading: string;
    /** Rendered BELOW the hero band on a sub-page, bottom-left aligned within
     * its own padding -- the reference site never overlays a tagline on the
     * image itself outside the home page's carousel. */
    tagline?: string;
    body?: string;
    /** An already-resolved image URL -- the block engine resolves the
     * authored `image` manifestKey through the caller's `imageUrl` closure
     * before this component ever sees it (see ../blocks.tsx). Used when
     * there's exactly one image; a multi-slide hero uses `slides` instead. */
    imageUrl?: string;
    imageAlt?: string;
    /** Multiple images auto-advance the same way `Gallery`'s own carousel
     * does -- the reference site's own home-page hero. When both `slides`
     * and `imageUrl` are given, `slides` wins. */
    slides?: HeroSlide[];
    cta?: {
        label: string;
        href: string;
    };
    headingClassName?: string;
    /**
     * `"carousel"`: the reference's own 734px home-page hero (multi-slide,
     * scrim on every slide). `"subpage"` (default): the reference's own
     * 400px sub-page hero, single image, no auto-advance even if `slides`
     * happens to carry more than one.
     */
    variant?: "carousel" | "subpage";
}
export declare function Hero({ eyebrow, heading, tagline, body, imageUrl, imageAlt, slides, cta, headingClassName, variant, }: HeroProps): ReactElement;
