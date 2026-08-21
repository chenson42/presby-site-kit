import type { ReactElement } from "react";
import type { ScheduleEntry } from "../types";
export interface ServiceTimesProps {
    /** No page-level props in the design note — this always reads
     * `input.profile.serviceTimes`, resolved by the block engine
     * (../blocks.tsx) so it's always current without a content-repo edit. */
    serviceTimes: ScheduleEntry[];
    headingClassName?: string;
}
/** Renders nothing when there are no service times set — this is the
 * omissibility contract this block exists to demonstrate. */
export declare function ServiceTimes({ serviceTimes, headingClassName, }: ServiceTimesProps): ReactElement | null;
