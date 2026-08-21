import type { ReactElement } from "react";
export interface ProseProps {
    /** Markdown source, rendered through the constrained markdown-to-React
     * path in ../markdown.tsx — headings/paragraphs/lists/links/emphasis
     * only. See that file's own header comment for the safety reasoning. */
    body: string;
    headingClassName?: string;
}
export declare function Prose({ body, headingClassName }: ProseProps): ReactElement;
