import type { ReactElement } from "react";
export interface SermonEmbedProps {
    liveUrl?: string;
    archiveUrl?: string;
    /** Content-authored caption below the heading, above the player. */
    description?: string;
    headingClassName?: string;
}
/** Renders nothing when neither URL is set — presby does not host video
 * itself, so this is fundamentally a link-out, and a page with no link to
 * offer offers nothing.
 *
 * `archiveUrl`/`liveUrl` serve two roles at once: whichever one resolves
 * through `toTrustedEmbedUrl()` (see ../utils.ts's own header comment for
 * the allowlist/validation reasoning — never a raw content-authored URL
 * reaching an `<iframe src>`) becomes the actual embedded player; the
 * archive URL is tried first since the reference site's own "watch past
 * services" playlist is what's reliably embeddable (a bare
 * `/channel/<id>/live` URL, the live-stream shape, carries no video or
 * list id `toTrustedEmbedUrl` can validate, so it stays a plain link-out
 * in practice). Whichever URL does NOT become the embed still renders as
 * its own external link below the frame — a visitor always has a way to
 * reach both without depending on the embed resolving.
 */
export declare function SermonEmbed({ liveUrl, archiveUrl, description, headingClassName, }: SermonEmbedProps): ReactElement | null;
