import type { ReactElement } from "react";

export interface StaffPerson {
  name: string;
  /** Optional -- the reference site's committees page lists members by name
   * only, with no per-person role/title at all (the group's own name, a
   * `####` heading right above the staff-list, already says which
   * committee they're on; repeating it under every single person there
   * was a real, confirmed redundancy). Leadership's own staff entries DO
   * carry a genuine per-person role and keep rendering it -- this is an
   * optional field, not a removed one. */
  title?: string;
  phone?: string;
  email?: string;
  /** An already-resolved image URL — see Hero.tsx's own note on the same
   * pattern for `image`/`photo` manifestKeys. */
  photoUrl?: string;
}

export interface StaffListProps {
  people: StaffPerson[];
  headingClassName?: string;
}

export function StaffList({
  people,
  headingClassName,
}: StaffListProps): ReactElement | null {
  if (people.length === 0) return null;
  return (
    <section data-block="staff-list">
      <ul>
        {people.map((person, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} />
            ) : null}
            <h3 className={headingClassName}>{person.name}</h3>
            {person.title ? <p data-slot="title">{person.title}</p> : null}
            {/* Plain text, not a tel: link -- the reference's own leadership
             * page (checked directly: computed style + raw HTML) renders
             * phone as plain text in the SAME <p> as the email, e.g.
             * "614-882-3155 (office)" -- no href, no anchor. Only email is
             * an actual <a>. A caller that wants the "(office)"/"(cell)"
             * annotation includes it directly in the phone string. */}
            {person.phone ? <p data-slot="phone">{person.phone}</p> : null}
            {person.email ? (
              <a href={`mailto:${person.email}`}>{person.email}</a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
