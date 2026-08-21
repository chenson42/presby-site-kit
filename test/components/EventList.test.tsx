import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventList } from "../../src/components/EventList";

describe("EventList", () => {
  it("renders title, a UTC-formatted date range, and location when set", () => {
    render(
      <EventList
        events={[
          {
            title: "Fall Festival",
            startsAt: "2026-10-17T18:00:00.000Z",
            endsAt: "2026-10-17T20:00:00.000Z",
            location: "Fellowship Hall",
            href: "/events/fall-festival",
          },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Fall Festival" })).toBeTruthy();
    expect(screen.getByText("Fellowship Hall")).toBeTruthy();
    // UTC-fixed formatting (see src/utils.ts formatEventDateTime) — this
    // assertion is stable regardless of the machine running the test suite.
    expect(screen.getByText(/Oct 17, 2026, 6:00 PM – Oct 17, 2026, 8:00 PM/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Fall Festival/ }).getAttribute("href"),
    ).toBe("/events/fall-festival");
  });

  it("omits the href wrapper, end time, and location when unset", () => {
    const { container } = render(
      <EventList events={[{ title: "Prayer Walk", startsAt: "2026-11-01T15:00:00.000Z" }]} />,
    );
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector('[data-slot="location"]')).toBeNull();
    expect(screen.getByText(/Nov 1, 2026, 3:00 PM$/)).toBeTruthy();
  });

  it("renders nothing for an empty events array", () => {
    const { container } = render(<EventList events={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
