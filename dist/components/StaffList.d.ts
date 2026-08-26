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
export declare function StaffList({ people, headingClassName, }: StaffListProps): ReactElement | null;
