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
   * (`margin-top: auto` in styles.css), never the reverse. `imageUrl`, if
   * set, still renders -- but as a hidden full-bleed background layer that
   * only fades in at low opacity on hover (the reference's own
   * `.card-item .image-wrapper` "ghost image" treatment: opacity: 0 ->
   * visible, transition: 0.3s, the photo itself capped at opacity: 0.3 so
   * the tile's solid color still dominates). Confirmed via the reference's
   * own compiled CSS, not visible in a static screenshot since it's a
   * hover-only reveal.
   */
  variant?: "card" | "solid";
}

/** Renders nothing when `items` is empty -- every valid-but-empty block
 * collapses to "render nothing for this block", not an empty shell. */
export function FeatureGrid({
  items,
  headingClassName,
  variant = "card",
}: FeatureGridProps): ReactElement | null {
  if (items.length === 0) return null;
  return (
    <section data-block="feature-grid" data-variant={variant}>
      <ul>
        {items.map((item, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            <a href={item.href}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.imageAlt ?? ""} />
              ) : null}
              <div data-slot="content">
                <h2 className={headingClassName}>{item.heading}</h2>
                <p>{item.body}</p>
              </div>
              {variant === "solid" ? (
                <span data-slot="arrow" aria-hidden="true" />
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
