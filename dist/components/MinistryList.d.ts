import type { ReactElement } from "react";
export interface MinistryListItem {
    heading: string;
    body: string;
    /** An already-resolved image URL — see Hero.tsx's own note on the same
     * pattern for `image`/`photo` manifestKeys. Optional: an item with no
     * image renders exactly as it always has. */
    imageUrl?: string;
    imageAlt?: string;
}
export interface MinistryListProps {
    items: MinistryListItem[];
    headingClassName?: string;
}
export declare function MinistryList({ items, headingClassName, }: MinistryListProps): ReactElement | null;
