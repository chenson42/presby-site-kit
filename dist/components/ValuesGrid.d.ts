import type { ReactElement } from "react";
export interface ValuesGridItem {
    heading: string;
    body: string;
}
export interface ValuesGridProps {
    items: ValuesGridItem[];
    headingClassName?: string;
}
export declare function ValuesGrid({ items, headingClassName, }: ValuesGridProps): ReactElement | null;
