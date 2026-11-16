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
    /** `"solid"` variant only: this tile's own background, an already
     * validated `#rrggbb` dark enough for its white text (see blocks.tsx).
     * Unset uses the brand's --primary, as every solid tile always has. */
    color?: string;
    /** `"icon"` variant only: a button-styled label under the description
     * ("Learn more"). Part of the same single link as the tile; unset shows
     * no button. */
    cta?: string;
}
export interface FeatureGridProps {
    items: FeatureGridItem[];
    headingClassName?: string;
    /**
     * `"card"` (default): a plain image-topped card, the original shape.
     * `"solid"`: a full-bleed color card (the reference site's own
     * "Worship / Music / Service / Connection" tiles) -- title and body
     * anchor to the TOP, and an arrow renders alone at the BOTTOM
     * (`margin-top: auto` in styles.css), never the reverse. `imageUrl`, if
     * set, still renders -- but as a hidden full-bleed background layer that
     * only fades in at low opacity on hover (the reference's own
     * `.card-item .image-wrapper` "ghost image" treatment: opacity: 0 ->
     * visible, transition: 0.3s, the photo itself capped at opacity: 0.3 so
     * the tile's solid color still dominates). Confirmed via the reference's
     * own compiled CSS, not visible in a static screenshot since it's a
     * hover-only reveal.
     *
     * `"icon"`: a shorter dark tile (the item's `color`, else --primary)
     * with the item's image as a centred icon (shown whole, never cropped)
     * and the heading in capitals; the description and an optional
     * button-styled `cta` sit centred BELOW the tile. The whole card is one
     * link, so the button is a styled span, not a second link to the same
     * place.
     */
    variant?: "card" | "solid" | "icon";
}
/** Renders nothing when `items` is empty -- every valid-but-empty block
 * collapses to "render nothing for this block", not an empty shell. */
export declare function FeatureGrid({ items, headingClassName, variant, }: FeatureGridProps): ReactElement | null;
