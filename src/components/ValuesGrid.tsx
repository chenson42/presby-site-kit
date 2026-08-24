import type { ReactElement } from "react";

export interface ValuesGridItem {
  heading: string;
  body: string;
  /** An already-resolved image URL — see Hero.tsx's own note on the same
   * pattern for `image`/`photo` manifestKeys. Optional: an item with no
   * image renders exactly as it always has. */
  imageUrl?: string;
  imageAlt?: string;
}

export interface ValuesGridProps {
  items: ValuesGridItem[];
  headingClassName?: string;
}

export function ValuesGrid({
  items,
  headingClassName,
}: ValuesGridProps): ReactElement | null {
  if (items.length === 0) return null;
  return (
    <section data-block="values-grid">
      <ul>
        {items.map((item, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.imageAlt ?? ""} />
            ) : null}
            <h3 className={headingClassName}>{item.heading}</h3>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
