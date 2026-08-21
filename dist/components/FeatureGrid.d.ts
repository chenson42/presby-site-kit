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
export declare function FeatureGrid({ items, headingClassName, }: FeatureGridProps): ReactElement | null;
