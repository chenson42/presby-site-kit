import type { ReactElement } from "react";
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
    /**
     * Opts a single-column prose block out of the default 42rem
     * narrow-reading-column treatment, rendering it at the same full content
     * width as every other top-level block instead. For heading+description
     * pairs authored as short section intros between full-width sibling
     * blocks (e.g. a committee's name + one-sentence description sitting
     * between StaffList grids) rather than genuine long-form body copy --
     * confirmed against the reference's own committees page, where each
     * heading/paragraph pair starts at the same left edge as the page H1 and
     * the staff photo grids, not indented into a centered narrow column.
     * Distinct from `columns` (2/3 side-by-side text columns): this is a
     * width-only opt-out for a single column of text, not a column-count
     * change, so it does not force `columns` to be set.
     */
    fullWidth?: boolean;
}
export declare function Prose({ body, headingClassName, columns, headingColor, fullWidth, }: ProseProps): ReactElement;
