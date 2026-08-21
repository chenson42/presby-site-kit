import type { ReactNode } from "react";
export interface RenderMarkdownOptions {
    body: string;
    headingClassName?: string;
}
export declare function renderMarkdown({ body, headingClassName, }: RenderMarkdownOptions): ReactNode[];
