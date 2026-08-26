import { type ReactElement } from "react";
export interface GalleryImage {
    /** An already-resolved image URL — see Hero.tsx's own note on the same
     * pattern for `image`/`photo` manifestKeys. */
    url: string;
    alt: string;
}
export interface GalleryProps {
    images: GalleryImage[];
    /** Milliseconds between auto-advances. Defaults to 5000, matching the
     * reference site's own carousels (4000–5000ms across its instances). */
    intervalMs?: number;
    /**
     * `"carousel"` (default): the auto-playing one-at-a-time slideshow below.
     * `"grid"`: a static side-by-side image row — several reference sections
     * (e.g. the mobility-assistance program's equipment photos) show multiple
     * images at once with no rotation; forcing those through the carousel
     * would hide all but one image behind an auto-advancing timer nobody
     * asked for.
     */
    variant?: "carousel" | "grid";
}
/**
 * A single-image-at-a-time auto-playing carousel — the multi-image gallery
 * block site-kit had no equivalent for before this release. The reference
 * site's own carousels (history photos, program galleries) always
 * auto-played with no way to stop them; this component keeps auto-play as
 * the default behavior but never as the *only* one, because uncontrollable
 * auto-advancing content is a real WCAG 2.2.2 failure, not a style
 * preference: a play/pause toggle, pause-on-hover, pause-on-focus, and a
 * `prefers-reduced-motion` check (auto-play never starts when the visitor's
 * OS says to avoid motion) are all load-bearing, not decoration.
 *
 * The second client component in this package, after `Nav` — a real
 * timer and real open/closed-equivalent state can't be server-rendered.
 * Every other piece of this library stays a pure server function.
 */
export declare function Gallery({ images, intervalMs, variant, }: GalleryProps): ReactElement | null;
