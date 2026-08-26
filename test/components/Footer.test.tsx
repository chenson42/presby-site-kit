import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "../../src/components/Footer";
import type { NavEntry } from "../../src/components/Nav";
import { emptyProfile, fullProfile } from "../fixtures";

const baseProps = {
  entries: [] as NavEntry[],
  logoUrl: null,
  logoAlt: "",
  organizationName: "Test Church",
};

const groupedEntries: NavEntry[] = [
  { path: "/worship", label: "Worship", href: "/site/x/worship", group: "Visit", highlight: false },
  { path: "/music", label: "Music", href: "/site/x/music", group: "Visit", highlight: false },
  { path: "/give", label: "Give", href: "https://give.example.invalid", group: null, highlight: true },
];

describe("Footer", () => {
  it("renders nothing when profile is null and there are no nav groups", () => {
    const { container } = render(<Footer profile={null} {...baseProps} />);
    expect(container.innerHTML).toBe("");
  });

  it("still renders when profile is null but nav groups exist (org name/logo has nothing to grow into)", () => {
    const { container } = render(
      <Footer profile={null} {...baseProps} entries={groupedEntries} />,
    );
    expect(container.querySelector("footer")).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="footer-nav-groups"] > div').length).toBe(1);
  });

  it("renders every profile-driven piece when the profile is fully populated", () => {
    const { container } = render(<Footer profile={fullProfile} {...baseProps} />);
    expect(container.querySelector('[data-slot="address"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="directions-button"]')?.getAttribute("href")).toMatch(
      /^https:\/\/www\.google\.com\/maps\/search\//,
    );
    expect(container.querySelector('[data-slot="phone"] a')?.getAttribute("href")).toBe(
      "tel:555-0100",
    );
    expect(container.querySelector('[data-slot="schedules"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="social-links"] a').length).toBe(2);
  });

  it("omits every profile-driven piece when the profile has no data set", () => {
    const { container } = render(<Footer profile={emptyProfile} {...baseProps} />);
    expect(container.querySelector('[data-slot="address"]')).toBeNull();
    expect(container.querySelector('[data-slot="phone"]')).toBeNull();
    expect(container.querySelector('[data-slot="schedules"]')).toBeNull();
    expect(container.querySelector('[data-slot="social-links"]')).toBeNull();
    expect(container.querySelector('[data-slot="directions-button"]')).toBeNull();
  });

  it("omits only the address (and its directions link) when address is unset", () => {
    const { container } = render(
      <Footer profile={{ ...fullProfile, address: null }} {...baseProps} />,
    );
    expect(container.querySelector('[data-slot="address"]')).toBeNull();
    expect(container.querySelector('[data-slot="directions-button"]')).toBeNull();
    expect(container.querySelector('[data-slot="phone"]')).not.toBeNull();
  });

  it("omits only the phone line when phone is unset", () => {
    const { container } = render(
      <Footer profile={{ ...fullProfile, phone: null }} {...baseProps} />,
    );
    expect(container.querySelector('[data-slot="phone"]')).toBeNull();
    expect(container.querySelector('[data-slot="address"]')).not.toBeNull();
  });

  it("omits only the social icon row when socialLinks is empty", () => {
    const { container } = render(
      <Footer profile={{ ...fullProfile, socialLinks: [] }} {...baseProps} />,
    );
    expect(container.querySelector('[data-slot="social-links"]')).toBeNull();
    expect(container.querySelector('[data-slot="schedules"]')).not.toBeNull();
  });

  it("groups nav entries into columns by their `group`, excluding ungrouped/highlight entries", () => {
    const { container } = render(
      <Footer profile={null} {...baseProps} entries={groupedEntries} />,
    );
    const group = container.querySelector('[data-slot="footer-nav-groups"] > div');
    expect(group?.querySelector("h2")?.textContent).toBe("Visit");
    expect(group?.querySelectorAll("li").length).toBe(2);
    // "Give" has group: null -- it belongs in Nav's top-level list, never
    // a footer column of its own.
    expect(container.textContent).not.toContain("Give");
  });

  it("renders the org name as a typographic fallback when logoUrl is null", () => {
    const { container } = render(<Footer profile={null} {...baseProps} entries={groupedEntries} />);
    expect(container.querySelector('[data-slot="footer-logo-text"]')?.textContent).toBe(
      "Test Church",
    );
  });

  it("renders an <img> logo instead of the text fallback when logoUrl is set", () => {
    const { container } = render(
      <Footer
        profile={null}
        entries={groupedEntries}
        logoUrl="https://cdn.example.invalid/logo.svg"
        logoAlt="Test Church logo"
        organizationName="Test Church"
      />,
    );
    expect(container.querySelector('[data-slot="footer-logo"]')?.getAttribute("src")).toBe(
      "https://cdn.example.invalid/logo.svg",
    );
    expect(container.querySelector('[data-slot="footer-logo-text"]')).toBeNull();
  });
});
