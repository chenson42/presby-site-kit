import type { ReactElement } from "react";
export interface SermonEmbedProps {
    liveUrl?: string;
    archiveUrl?: string;
    headingClassName?: string;
}
/** Renders nothing when neither URL is set — presby does not host video
 * itself, so this is a link-out, and a page with no link to offer offers
 * nothing. */
export declare function SermonEmbed({ liveUrl, archiveUrl, headingClassName, }: SermonEmbedProps): ReactElement | null;
