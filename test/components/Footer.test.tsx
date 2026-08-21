import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "../../src/components/Footer";
import { emptyProfile, fullProfile } from "../fixtures";

describe("Footer", () => {
  it("renders nothing at all when profile is null", () => {
    const { container } = render(<Footer profile={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders every piece when the profile is fully populated", () => {
    const { container } = render(<Footer profile={fullProfile} />);
    expect(container.querySelector('[data-slot="address"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="address"] a')?.getAttribute("href")).toMatch(
      /^https:\/\/www\.google\.com\/maps\/search\//,
    );
    expect(container.querySelector('[data-slot="phone"] a')?.getAttribute("href")).toBe(
      "tel:555-0100",
    );
    expect(container.querySelector('[data-slot="service-times"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="office-hours"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="social-links"] a').length).toBe(2);
  });

  it("omits every piece — no empty shells — when the profile has no data set", () => {
    const { container } = render(<Footer profile={emptyProfile} />);
    expect(container.querySelector('[data-slot="address"]')).toBeNull();
    expect(container.querySelector('[data-slot="phone"]')).toBeNull();
    expect(container.querySelector('[data-slot="service-times"]')).toBeNull();
    expect(container.querySelector('[data-slot="office-hours"]')).toBeNull();
    expect(container.querySelector('[data-slot="social-links"]')).toBeNull();
    // The footer element itself is still present (an org with literally
    // nothing set still gets footer chrome to grow into) — but it's empty.
    expect(container.querySelector("footer")?.textContent).toBe("");
  });

  it("omits only the address (and its directions link) when address is unset", () => {
    const { container } = render(
      <Footer profile={{ ...fullProfile, address: null }} />,
    );
    expect(container.querySelector('[data-slot="address"]')).toBeNull();
    expect(container.querySelector('[data-slot="phone"]')).not.toBeNull();
  });

  it("omits only the phone line when phone is unset", () => {
    const { container } = render(<Footer profile={{ ...fullProfile, phone: null }} />);
    expect(container.querySelector('[data-slot="phone"]')).toBeNull();
    expect(container.querySelector('[data-slot="address"]')).not.toBeNull();
  });

  it("omits only the social icon row when socialLinks is empty", () => {
    const { container } = render(
      <Footer profile={{ ...fullProfile, socialLinks: [] }} />,
    );
    expect(container.querySelector('[data-slot="social-links"]')).toBeNull();
    expect(container.querySelector('[data-slot="service-times"]')).not.toBeNull();
  });

  it("omits service times and office hours independently of one another", () => {
    const { container: noServiceTimes } = render(
      <Footer profile={{ ...fullProfile, serviceTimes: [] }} />,
    );
    expect(noServiceTimes.querySelector('[data-slot="service-times"]')).toBeNull();
    expect(noServiceTimes.querySelector('[data-slot="office-hours"]')).not.toBeNull();

    const { container: noOfficeHours } = render(
      <Footer profile={{ ...fullProfile, officeHours: [] }} />,
    );
    expect(noOfficeHours.querySelector('[data-slot="office-hours"]')).toBeNull();
    expect(noOfficeHours.querySelector('[data-slot="service-times"]')).not.toBeNull();
  });
});
