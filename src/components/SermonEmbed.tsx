import type { ReactElement } from "react";

export interface SermonEmbedProps {
  liveUrl?: string;
  archiveUrl?: string;
  headingClassName?: string;
}

/** Renders nothing when neither URL is set — presby does not host video
 * itself, so this is a link-out, and a page with no link to offer offers
 * nothing. */
export function SermonEmbed({
  liveUrl,
  archiveUrl,
  headingClassName,
}: SermonEmbedProps): ReactElement | null {
  if (!liveUrl && !archiveUrl) return null;
  return (
    <section data-block="sermon-embed">
      <h2 className={headingClassName}>Worship Online</h2>
      {liveUrl ? <a href={liveUrl}>Watch live</a> : null}
      {archiveUrl ? <a href={archiveUrl}>Watch past services</a> : null}
    </section>
  );
}
