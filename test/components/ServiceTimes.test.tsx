import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ServiceTimes } from "../../src/components/ServiceTimes";

describe("ServiceTimes", () => {
  it("renders each entry with a friendly day name and 12-hour clock time", () => {
    render(
      <ServiceTimes
        serviceTimes={[
          { dayOfWeek: 0, startTime: "10:15", endTime: "11:30", label: "Traditional" },
          { dayOfWeek: 3, startTime: "18:30", endTime: "19:15", label: null },
        ]}
      />,
    );
    expect(screen.getByText(/Traditional — Sunday 10:15 AM–11:30 AM/)).toBeTruthy();
    expect(screen.getByText(/Wednesday 6:30 PM–7:15 PM/)).toBeTruthy();
  });

  it("renders nothing when there are no service times", () => {
    const { container } = render(<ServiceTimes serviceTimes={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("REGRESSION: formats Postgres's HH:MM:SS shape, not just HH:MM", () => {
    render(
      <ServiceTimes
        serviceTimes={[
          { dayOfWeek: 0, startTime: "10:15:00", endTime: "11:15:00", label: "Sunday Worship" },
        ]}
      />,
    );
    expect(screen.getByText(/Sunday Worship — Sunday 10:15 AM–11:15 AM/)).toBeTruthy();
  });
});
