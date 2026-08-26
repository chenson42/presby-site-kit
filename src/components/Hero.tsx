"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";

export interface HeroSlide {
  imageUrl: string;
  imageAlt: string;
  /** Per-slide text, matching the reference's own carousel -- each of its
   * three home-page slides carries distinct copy ("We're so glad you're
   * here." / "Community since 1829" / "Energetic. Supportive. Open."), not
   * one static heading over a rotating background. Unset on a slide falls
   * back to the hero's own top-level `eyebrow`/`heading` -- the sub-page,
   * single-image case never needs to repeat itself per slide. */
  eyebrow?: string;
  heading?: string;
}

export interface HeroProps {
  eyebrow?: string;
  heading: string;
  /** Rendered BELOW the hero band on a sub-page, bottom-left aligned within
   * its own padding -- the reference site never overlays a tagline on the
   * image itself outside the home page's carousel. */
  tagline?: string;
  body?: string;
  /** An already-resolved image URL -- the block engine resolves the
   * authored `image` manifestKey through the caller's `imageUrl` closure
   * before this component ever sees it (see ../blocks.tsx). Used when
   * there's exactly one image; a multi-slide hero uses `slides` instead. */
  imageUrl?: string;
  imageAlt?: string;
  /** Multiple images auto-advance the same way `Gallery`'s own carousel
   * does -- the reference site's own home-page hero. When both `slides`
   * and `imageUrl` are given, `slides` wins. */
  slides?: HeroSlide[];
  cta?: { label: string; href: string };
  headingClassName?: string;
  /**
   * `"carousel"`: the reference's own 734px home-page hero (multi-slide,
   * scrim on every slide). `"subpage"` (default): the reference's own
   * 400px sub-page hero, single image, no auto-advance even if `slides`
   * happens to carry more than one.
   */
  variant?: "carousel" | "subpage";
}

export function Hero({
  eyebrow,
  heading,
  tagline,
  body,
  imageUrl,
  imageAlt,
  slides,
  cta,
  headingClassName,
  variant = "subpage",
}: HeroProps): ReactElement {
  const images: HeroSlide[] =
    slides && slides.length > 0
      ? slides
      : imageUrl
        ? [{ imageUrl, imageAlt: imageAlt ?? "" }]
        : [];
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const advancing = variant === "carousel" && images.length > 1 && !reducedMotion;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!advancing) return;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [advancing, images.length]);

  const current = images[index] ?? images[0];
  const currentEyebrow = current?.eyebrow ?? eyebrow;
  const currentHeading = current?.heading ?? heading;

  return (
    <section data-block="hero" data-variant={variant}>
      <div data-slot="frame">
        {current ? <img src={current.imageUrl} alt={current.imageAlt} /> : null}
        <div data-slot="scrim" aria-hidden="true" />
        <div data-slot="content">
          {currentEyebrow ? <p data-slot="eyebrow">{currentEyebrow}</p> : null}
          <h1 className={headingClassName}>{currentHeading}</h1>
          {body ? <p data-slot="body">{body}</p> : null}
          {cta ? <a href={cta.href}>{cta.label}</a> : null}
        </div>
        {images.length > 1 ? (
          <div data-slot="dots" role="tablist" aria-label="Slides">
            {images.map((slide, dotIndex) => (
              <button
                // eslint-disable-next-line react/no-array-index-key
                key={dotIndex}
                type="button"
                role="tab"
                aria-selected={dotIndex === index}
                aria-label={`Show slide ${dotIndex + 1} of ${images.length}`}
                data-active={dotIndex === index ? "true" : "false"}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>
        ) : null}
      </div>
      {/* The reference's own markup: this is a real <h5>, in its own
       * section below the hero -- not a paragraph. Verified against the
       * real page's compiled HTML (<div class="section-text-block">
       * <h5>Faith and friendships grow here.</h5></div>). */}
      {tagline ? <h5 data-slot="tagline">{tagline}</h5> : null}
    </section>
  );
}
