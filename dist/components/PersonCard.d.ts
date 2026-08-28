import type { ReactElement } from "react";
/**
 * A single-person primitive — genuinely separate from `StaffList`, not a
 * `StaffList`-of-one. `StaffList` renders every person as an `<li>` inside
 * one flat `<ul>`, which is only valid HTML nested under that wrapper; a
 * caller that needs MULTIPLE GROUPED sections (e.g. one per committee) has
 * no way to subdivide `StaffList`'s single `<ul>`, so `PersonCard` is the
 * atomic, standalone unit such a caller composes per group instead.
 *
 * Deliberately no `phone`/`email` props at all — a structural fix, not a
 * documented caution. `StaffPerson` (see StaffList.tsx) carries optional
 * `phone`/`email` for the hand-authored `staffList` block's own, different,
 * looser trust tier; `PersonCard` is purpose-built for live, filtered,
 * admin-consented directory data (staff/officer/committee rosters), which
 * must never expose contact fields at all. A live caller has no such prop
 * to accidentally populate, full stop — not "and please remember not to."
 *
 * No shared internal fragment with `StaffList`: the overlap (a conditional
 * `<img>`, an `<h3>{name}</h3>`, an optional `<p data-slot="title">`) is
 * about six lines, but the two components' container contracts (`<li>`
 * inside `StaffList`'s own `<ul>` vs. a standalone `<div>` here) and prop
 * shapes (StaffPerson's `phone`/`email` vs. this component's deliberate
 * absence of them) diverge enough that a shared helper would need more
 * branching than it saves — and would recouple two components whose future
 * evolution paths (hand-authored content vs. live, consent-gated data) are
 * meant to stay independent. Accepted duplication, named explicitly.
 *
 * Exported as a plain component only — no `personCard` block type is added
 * to `BLOCK_REGISTRY` in this pass; that would be a hand-authored-content
 * use case nothing has scoped yet.
 */
export interface PersonCardProps {
    name: string;
    title?: string;
    photoUrl?: string;
    headingClassName?: string;
    className?: string;
}
export declare function PersonCard({ name, title, photoUrl, headingClassName, className, }: PersonCardProps): ReactElement;
