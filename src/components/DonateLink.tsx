import type { ReactElement } from "react";

export interface DonateLinkProps {
  label: string;
  href: string;
}

/** A styled external link — presby does not process payments itself.
 * `target="_blank"` always pairs with `rel="noopener noreferrer"` (reverse-
 * tabnabbing is a real risk for any external link this package renders on
 * a congregation's behalf, not a hypothetical). */
export function DonateLink({ label, href }: DonateLinkProps): ReactElement {
  return (
    <a data-block="donate-link" href={href} target="_blank" rel="noopener noreferrer">
      {label}
    </a>
  );
}
