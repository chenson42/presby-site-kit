import type { ReactElement } from "react";

export interface FeatureGridItem {
  heading: string;
  body: string;
  href: string;
  /** An already-resolved image URL — see Hero.tsx's own note on the same
   * pattern for `image`/`photo` manifestKeys. Optional: a card with no
   * image renders exactly as it always has. */
  imageUrl?: string;
  imageAlt?: string;
}

export interface FeatureGridProps {
  items: FeatureGridItem[];
  headingClassName?: string;
}

/** Renders nothing when `items` is empty — every valid-but-empty block
 * collapses to "render nothing for this block", not an empty shell. */
export function FeatureGrid({
  items,
  headingClassName,
}: FeatureGridProps): ReactElement | null {
  if (items.length === 0) return null;
  return (
    <section data-block="feature-grid">
      <ul>
        {items.map((item, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            <a href={item.href}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.imageAlt ?? ""} />
              ) : null}
              <h2 className={headingClassName}>{item.heading}</h2>
              <p>{item.body}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
