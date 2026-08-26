"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";

export interface GalleryImage {
  /** An already-resolved image URL — see Hero.tsx's own note on the same
   * pattern for `image`/`photo` manifestKeys. */
  url: string;
  alt: string;
}

export interface GalleryProps {
  images: GalleryImage[];
  /** Milliseconds between auto-advances. Defaults to 5000, matching the
   * reference site's own carousels (4000–5000ms across its instances). */
  intervalMs?: number;
  /**
   * `"carousel"` (default): the auto-playing one-at-a-time slideshow below.
   * `"grid"`: a static side-by-side image row — several reference sections
   * (e.g. the mobility-assistance program's equipment photos) show multiple
   * images at once with no rotation; forcing those through the carousel
   * would hide all but one image behind an auto-advancing timer nobody
   * asked for.
   */
  variant?: "carousel" | "grid";
}

/**
 * A single-image-at-a-time auto-playing carousel — the multi-image gallery
 * block site-kit had no equivalent for before this release. The reference
 * site's own carousels (history photos, program galleries) always
 * auto-played with no way to stop them; this component keeps auto-play as
 * the default behavior but never as the *only* one, because uncontrollable
 * auto-advancing content is a real WCAG 2.2.2 failure, not a style
 * preference: a play/pause toggle, pause-on-hover, pause-on-focus, and a
 * `prefers-reduced-motion` check (auto-play never starts when the visitor's
 * OS says to avoid motion) are all load-bearing, not decoration.
 *
 * The second client component in this package, after `Nav` — a real
 * timer and real open/closed-equivalent state can't be server-rendered.
 * Every other piece of this library stays a pure server function.
 */
export function Gallery({
  images,
  intervalMs = 5000,
  variant = "carousel",
}: GalleryProps): ReactElement | null {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const count = images.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const advancing = playing && !hovered && !focused && !reducedMotion && count > 1;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!advancing) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advancing, count, intervalMs]);

  if (count === 0) return null;

  // After ALL hooks above (Rules of Hooks) -- the grid variant is a plain
  // static row with no carousel state of its own. A conditional return
  // ABOVE the hooks would change the hook call count between renders the
  // moment `variant` differs, which is exactly the bug this ordering
  // avoids.
  if (variant === "grid") {
    return (
      <section data-block="gallery" data-variant="grid">
        <ul>
          {images.map((image, gridIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <li key={gridIndex}>
              <img src={image.url} alt={image.alt} />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const current = images[index] ?? images[0];

  return (
    <section
      data-block="gallery"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <div data-slot="frame">
        {current ? <img src={current.url} alt={current.alt} /> : null}
        {count > 1 ? (
          <button
            type="button"
            data-slot="play-toggle"
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            aria-pressed={playing}
            onClick={() => setPlaying((value) => !value)}
          >
            {playing ? "Pause" : "Play"}
          </button>
        ) : null}
      </div>
      {count > 1 ? (
        <div data-slot="dots" role="tablist" aria-label="Slides">
          {images.map((image, dotIndex) => (
            <button
              // eslint-disable-next-line react/no-array-index-key
              key={dotIndex}
              type="button"
              role="tab"
              aria-selected={dotIndex === index}
              aria-label={`Show image ${dotIndex + 1} of ${count}`}
              data-active={dotIndex === index ? "true" : "false"}
              onClick={() => setIndex(dotIndex)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
