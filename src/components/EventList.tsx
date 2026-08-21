import type { ReactElement } from "react";
import { formatEventDateTime } from "../utils";

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

export function EventList({
  events,
  headingClassName,
}: EventListProps): ReactElement | null {
  if (events.length === 0) return null;
  return (
    <section data-block="event-list">
      <ul>
        {events.map((event, index) => {
          const starts = formatEventDateTime(event.startsAt);
          const ends = event.endsAt ? formatEventDateTime(event.endsAt) : null;
          const heading = <h3 className={headingClassName}>{event.title}</h3>;
          return (
            // eslint-disable-next-line react/no-array-index-key
            <li key={index}>
              {event.href ? <a href={event.href}>{heading}</a> : heading}
              {starts ? (
                <p data-slot="when">
                  {starts}
                  {ends ? ` – ${ends}` : ""}
                </p>
              ) : null}
              {event.location ? <p data-slot="location">{event.location}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
