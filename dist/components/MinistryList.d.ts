import type { ReactElement } from "react";
export interface MinistryListItem {
    heading: string;
    body: string;
}
export interface MinistryListProps {
    items: MinistryListItem[];
    headingClassName?: string;
}
export declare function MinistryList({ items, headingClassName, }: MinistryListProps): ReactElement | null;
