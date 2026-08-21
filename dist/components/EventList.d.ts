import type { ReactElement } from "react";
export interface EventListEvent {
    title: string;
    startsAt: string;
    endsAt?: string;
    location?: string;
    href?: string;
}
export interface EventListProps {
    events: EventListEvent[];
    headingClassName?: string;
}
export declare function EventList({ events, headingClassName, }: EventListProps): ReactElement | null;
