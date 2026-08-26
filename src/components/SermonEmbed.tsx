import type { ReactElement } from "react";
import { toTrustedEmbedUrl } from "../utils";

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
export function SermonEmbed({
  liveUrl,
  archiveUrl,
  description,
  headingClassName,
}: SermonEmbedProps): ReactElement | null {
  if (!liveUrl && !archiveUrl) return null;

  const embedFromArchive = toTrustedEmbedUrl(archiveUrl);
  const embedIsArchive = embedFromArchive !== null;
  const embedUrl = embedFromArchive ?? toTrustedEmbedUrl(liveUrl);
  const embedIsLive = embedUrl !== null && !embedIsArchive;

  return (
    <section data-block="sermon-embed">
      <h2 className={headingClassName}>Worship Online</h2>
      {description ? <p data-slot="description">{description}</p> : null}
      {embedUrl ? (
        <div data-slot="frame">
          <iframe
            src={embedUrl}
            title="Worship service"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      <div data-slot="links">
        {liveUrl && !embedIsLive ? <a href={liveUrl}>Watch live</a> : null}
        {archiveUrl && !embedIsArchive ? <a href={archiveUrl}>Watch past services</a> : null}
      </div>
    </section>
  );
}
