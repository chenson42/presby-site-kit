import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Nav, type NavEntry } from "../../src/components/Nav";
import { testPageUrl, testPortalUrl } from "../fixtures";

const HOME: NavEntry = { path: "/", label: "Home", href: testPageUrl("/") };
const ABOUT: NavEntry = { path: "/about", label: "About", href: testPageUrl("/about") };

describe("Nav — page links", () => {
  it("renders nothing with zero entries and no portal link", () => {
    const { container } = render(<Nav entries={[]} currentPath="/hidden" portalUrl={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing with exactly one entry and no portal link — nothing to navigate to", () => {
    const { container } = render(<Nav entries={[HOME]} currentPath="/" portalUrl={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a link per entry, in order, using the already-resolved href", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Home", "About"]);
    expect(links[0]?.getAttribute("href")).toBe(testPageUrl("/"));
    expect(links[1]?.getAttribute("href")).toBe(testPageUrl("/about"));
  });

  it("marks the current page's link with aria-current, and no other", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/about" portalUrl={null} />);
    expect(screen.getByRole("link", { name: "About" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });
});

describe("Nav — member portal login link", () => {
  it("renders nothing when portalUrl is null and there are no entries", () => {
    const { container } = render(<Nav entries={[]} currentPath="/" portalUrl={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the login link even with zero entries — a one-page site still has members", () => {
    render(<Nav entries={[]} currentPath="/" portalUrl={testPortalUrl} />);
    const link = screen.getByRole("link", { name: "Member Login" });
    expect(link.getAttribute("href")).toBe(testPortalUrl);
  });

  it("renders the login link alongside page links when both are present", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={testPortalUrl} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Home", "About", "Member Login"]);
  });

  it("never gives the login link aria-current — it's a portal, not a page in this bundle", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={testPortalUrl} />);
    expect(
      screen.getByRole("link", { name: "Member Login" }).getAttribute("aria-current"),
    ).toBeNull();
  });
});

describe("Nav — narrow-viewport collapse (the CSS `@media` breakpoint hides `ul[data-open=\"false\"]`; this is the state the CSS switches on)", () => {
  it("starts closed: aria-expanded false, the menu list carries data-open=\"false\"", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("site-nav-menu")?.getAttribute("data-open")).toBe("false");
  });

  it("clicking the toggle opens the menu: aria-expanded true, data-open=\"true\", label flips to Close menu", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const toggle = screen.getByRole("button", { name: "Close menu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("site-nav-menu")?.getAttribute("data-open")).toBe("true");
  });

  it("clicking a page link after opening closes the menu again", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("link", { name: "About" }));
    expect(document.getElementById("site-nav-menu")?.getAttribute("data-open")).toBe("false");
  });

  it("the toggle button is present even with zero page entries, as long as the portal link renders", () => {
    render(<Nav entries={[]} currentPath="/" portalUrl={testPortalUrl} />);
    expect(screen.getByRole("button", { name: "Open menu" })).toBeTruthy();
  });
});
