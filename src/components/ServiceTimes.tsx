import type { ReactElement } from "react";
import type { ScheduleEntry } from "../types";
import { dayName, formatClockTime } from "../utils";

export interface ServiceTimesProps {
  /** No page-level props in the design note — this always reads
   * `input.profile.serviceTimes`, resolved by the block engine
   * (../blocks.tsx) so it's always current without a content-repo edit. */
  serviceTimes: ScheduleEntry[];
  headingClassName?: string;
}

/** Renders nothing when there are no service times set — this is the
 * omissibility contract this block exists to demonstrate. */
export function ServiceTimes({
  serviceTimes,
  headingClassName,
}: ServiceTimesProps): ReactElement | null {
  if (serviceTimes.length === 0) return null;
  return (
    <section data-block="service-times" aria-label="Service times">
      <h2 className={headingClassName}>Service Times</h2>
      <ul>
        {serviceTimes.map((entry, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <li key={index}>
            {entry.label ? `${entry.label} — ` : ""}
            {dayName(entry.dayOfWeek)} {formatClockTime(entry.startTime)}–
            {formatClockTime(entry.endTime)}
          </li>
        ))}
      </ul>
    </section>
  );
}
