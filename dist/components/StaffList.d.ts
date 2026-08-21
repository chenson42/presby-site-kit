import type { ReactElement } from "react";
export interface StaffPerson {
    name: string;
    title: string;
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
