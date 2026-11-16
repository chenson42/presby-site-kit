import type { CSSProperties, ReactElement } from "react";
import { renderMarkdown } from "../markdown";
import { relativeLuminance } from "../utils";

export interface CalloutProps {
  heading: string;
  /** Markdown source, rendered through the constrained markdown-to-React
   * path in ../markdown.tsx. */
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  /** Optional: the reference site's own "Stay in touch" callout has no
   * button at all, just the image and text. */
  cta?: { label: string; href: string };
  headingClassName?: string;
  /**
   * `"split"` (default): a two-column image/content layout, the original
   * shape. `"inset"`: a full-bleed color band (the reference's own
   * "Need medical equipment?" section) with the content centered inside
   * a `max()`-clamped inline padding, matching the site's own container
   * model rather than the page's normal content width.
   */
  variant?: "split" | "inset";
  /** Which side the image renders on, in BOTH variants -- the reference
   * alternates this per section ("Stay in touch"'s photo is on the
   * left, "Roger"'s portrait on the worship page is on the right).
   * Defaults to "left". */
  imageSide?: "left" | "right";
  /** An already-validated `#rrggbb` (see `asHexColor` in ../utils) --
   * `inset` only. Unset renders the caller's own default surface color. */
  background?: string;
  /** An already-validated `#rrggbb`, applied to the heading only. */
  headingColor?: string;
}

export function Callout({
  heading,
  body,
  imageUrl,
  imageAlt,
  cta,
  headingClassName,
  variant = "split",
  imageSide = "left",
  background,
  headingColor,
}: CalloutProps): ReactElement {
  const style: CSSProperties = {};
  if (variant === "inset" && background) {
    (style as Record<string, string>)["--site-callout-bg"] = background;
    // A dark band (e.g. the reference's own solid teal) needs white text; a
    // pale tint of that same hue (e.g. its light-green variant, an
    // opacity-reduced version of the same teal) needs dark ink instead.
    // Verified against the reference's own two section types: solid teal
    // computes to luminance ~0.33 (white text), the light-green tint to
    // ~0.71 (dark text) -- 0.5 cleanly separates the two real cases.
    style.color = relativeLuminance(background) > 0.5 ? "#293948" : "#fff";
  }
  const headingStyle: CSSProperties | undefined = headingColor
    ? { color: headingColor }
    : undefined;

  return (
    <section data-block="callout" data-variant={variant} data-image-side={imageSide} style={style}>
      {imageUrl ? (
        // Natural aspect ratio, never a forced square -- a portrait photo
        // (e.g. the worship page's own headshot) squashes badly under a
        // 1:1 crop; this component never assumes a photo's shape.
        <img data-slot="image" src={imageUrl} alt={imageAlt ?? ""} />
      ) : null}
      <div data-slot="content">
        <h2 className={headingClassName} style={headingStyle}>
          {heading}
        </h2>
        <div data-slot="body">{renderMarkdown({ body })}</div>
        {cta ? <a href={cta.href}>{cta.label}</a> : null}
      </div>
    </section>
  );
}
