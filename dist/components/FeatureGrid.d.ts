import type { ReactElement } from "react";
export interface FeatureGridItem {
    heading: string;
    body: string;
    href: string;
    /** An already-resolved image URL -- see Hero.tsx's own note on the same
     * pattern for `image`/`photo` manifestKeys. Optional: a card with no
     * image renders exactly as it always has. */
    imageUrl?: string;
    imageAlt?: string;
}
export interface FeatureGridProps {
    items: FeatureGridItem[];
    headingClassName?: string;
    /**
     * `"card"` (default): a plain image-topped card, the original shape.
     * `"solid"`: a full-bleed color card (the reference site's own
     * "Worship / Music / Service / Connection" tiles) -- title and body
     * anchor to the TOP, and an arrow renders alone at the BOTTOM
     * (`margin-top: auto` in styles.css), never the reverse. No image is
     * rendered in this variant even if `imageUrl` is set -- the tile's
     * whole surface IS the color.
     */
    variant?: "card" | "solid";
}
/** Renders nothing when `items` is empty -- every valid-but-empty block
 * collapses to "render nothing for this block", not an empty shell. */
export declare function FeatureGrid({ items, headingClassName, variant, }: FeatureGridProps): ReactElement | null;
