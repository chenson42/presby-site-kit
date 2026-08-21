import type { ReactElement } from "react";

export interface FeatureGridItem {
  heading: string;
  body: string;
  href: string;
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
              <h2 className={headingClassName}>{item.heading}</h2>
              <p>{item.body}</p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
