import type { ReactElement } from "react";
export interface CalloutProps {
    heading: string;
    body: string;
    imageUrl?: string;
    imageAlt?: string;
    cta: {
        label: string;
        href: string;
    };
    headingClassName?: string;
}
export declare function Callout({ heading, body, imageUrl, imageAlt, cta, headingClassName, }: CalloutProps): ReactElement;
