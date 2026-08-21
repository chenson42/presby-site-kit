import type { ReactElement } from "react";

export interface CalloutProps {
  heading: string;
  body: string;
  imageUrl?: string;
  imageAlt?: string;
  cta: { label: string; href: string };
  headingClassName?: string;
}

export function Callout({
  heading,
  body,
  imageUrl,
  imageAlt,
  cta,
  headingClassName,
}: CalloutProps): ReactElement {
  return (
    <section data-block="callout">
      {imageUrl ? <img src={imageUrl} alt={imageAlt ?? ""} /> : null}
      <h2 className={headingClassName}>{heading}</h2>
      <p>{body}</p>
      <a href={cta.href}>{cta.label}</a>
    </section>
  );
}
