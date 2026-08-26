import type { CSSProperties, ReactElement } from "react";
import { renderMarkdown } from "../markdown";

export interface ProseProps {
  /** Markdown source, rendered through the constrained markdown-to-React
   * path in ../markdown.tsx — headings/paragraphs/lists/links/emphasis
   * only. See that file's own header comment for the safety reasoning. */
  body: string;
  headingClassName?: string;
  /**
   * Multi-column text layout — the reference site lays some sections out as
   * side-by-side text columns ("How to borrow" | "Our process"). 2 or 3;
   * anything else renders single-column. A `---` horizontal rule in the
   * markdown doubles as the EXPLICIT column break (see styles.css), so an
   * author controls exactly where the split falls instead of trusting CSS
   * multicol balancing to not orphan a heading mid-column.
   */
  columns?: number;
  /**
   * An already-validated `#rrggbb` heading color (`renderProseBlock`
   * rejects anything else, same strict gate as callout's `background`) —
   * the reference colors many of its section headings per section (its
   * recurring `#42714f` green spans). Applied via a CSS custom property so
   * markdown output stays style-free; unset inherits the ink color.
   */
  headingColor?: string;
}

export function Prose({
  body,
  headingClassName,
  columns,
  headingColor,
}: ProseProps): ReactElement {
  const columnCount = columns === 2 || columns === 3 ? columns : undefined;
  return (
    <div
      data-block="prose"
      data-columns={columnCount}
      style={
        headingColor
          ? ({ "--md-heading-color": headingColor } as CSSProperties)
          : undefined
      }
    >
      {renderMarkdown({ body, headingClassName })}
    </div>
  );
}
