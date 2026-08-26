/**
 * Pulled out of Nav.tsx (a "use client" module) into its own plain file:
 * Footer.tsx needs the identical grouping logic to build its nav-group
 * columns, and Footer is server-rendered. Next.js treats every export of
 * a "use client" file as a client reference even when the function itself
 * touches no browser API -- calling `groupEntries` from server code threw
 * "Attempted to call groupEntries() from the server but groupEntries is
 * on the client," caught only by actually running the page, not by
 * typecheck or the unit suite. One grouping function, importable from
 * either side of the boundary, is the fix.
 */
import type { NavEntry } from "./components/Nav";
export interface GroupedEntries {
    group: string;
    items: NavEntry[];
}
export declare function groupEntries(entries: NavEntry[]): {
    top: NavEntry[];
    groups: GroupedEntries[];
};
