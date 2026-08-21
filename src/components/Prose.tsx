import type { ReactElement } from "react";
import { renderMarkdown } from "../markdown";

export interface ProseProps {
  /** Markdown source, rendered through the constrained markdown-to-React
   * path in ../markdown.tsx — headings/paragraphs/lists/links/emphasis
   * only. See that file's own header comment for the safety reasoning. */
  body: string;
  headingClassName?: string;
}

export function Prose({ body, headingClassName }: ProseProps): ReactElement {
  return <div data-block="prose">{renderMarkdown({ body, headingClassName })}</div>;
}
