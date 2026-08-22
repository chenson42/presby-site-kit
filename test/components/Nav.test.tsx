import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Nav } from "../../src/components/Nav";
import { testPageUrl, testPortalUrl } from "../fixtures";
import type { SiteKitPage } from "../../src/types";

const HOME: SiteKitPage = { path: "/", frontMatter: { navLabel: "Home" }, mdxAst: {} };
const ABOUT: SiteKitPage = { path: "/about", frontMatter: { navLabel: "About" }, mdxAst: {} };
const NO_NAV: SiteKitPage = { path: "/hidden", frontMatter: {}, mdxAst: {} };

describe("Nav — page links", () => {
  it("renders nothing with zero navigable pages and no portal link", () => {
    const { container } = render(
      <Nav pages={[NO_NAV]} currentPath="/hidden" pageUrl={testPageUrl} portalUrl={null} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing with exactly one navigable page and no portal link — nothing to navigate to", () => {
    const { container } = render(
      <Nav pages={[HOME, NO_NAV]} currentPath="/" pageUrl={testPageUrl} portalUrl={null} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders a link per page with a navLabel, in bundle order, omitting pages without one", () => {
    render(
      <Nav
        pages={[HOME, NO_NAV, ABOUT]}
        currentPath="/"
        pageUrl={testPageUrl}
        portalUrl={null}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Home", "About"]);
    expect(links[0]?.getAttribute("href")).toBe(testPageUrl("/"));
    expect(links[1]?.getAttribute("href")).toBe(testPageUrl("/about"));
  });

  it("marks the current page's link with aria-current, and no other", () => {
    render(
      <Nav pages={[HOME, ABOUT]} currentPath="/about" pageUrl={testPageUrl} portalUrl={null} />,
    );
    expect(screen.getByRole("link", { name: "About" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });

  it("ignores a non-string navLabel rather than throwing or rendering it", () => {
    const weird: SiteKitPage = { path: "/weird", frontMatter: { navLabel: 42 }, mdxAst: {} };
    const { container } = render(
      <Nav pages={[HOME, weird]} currentPath="/" pageUrl={testPageUrl} portalUrl={null} />,
    );
    // Only one real navLabel ("Home") and no portal link — still nothing.
    expect(container.innerHTML).toBe("");
  });
});

describe("Nav — member portal login link", () => {
  it("renders nothing when portalUrl is null and there are no navigable pages", () => {
    const { container } = render(
      <Nav pages={[]} currentPath="/" pageUrl={testPageUrl} portalUrl={null} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the login link even with zero navigable pages — a one-page site still has members", () => {
    render(<Nav pages={[]} currentPath="/" pageUrl={testPageUrl} portalUrl={testPortalUrl} />);
    const link = screen.getByRole("link", { name: "Member Login" });
    expect(link.getAttribute("href")).toBe(testPortalUrl);
  });

  it("renders the login link alongside page links when both are present", () => {
    render(
      <Nav
        pages={[HOME, ABOUT]}
        currentPath="/"
        pageUrl={testPageUrl}
        portalUrl={testPortalUrl}
      />,
    );
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Home", "About", "Member Login"]);
  });

  it("never gives the login link aria-current — it's a portal, not a page in this bundle", () => {
    render(
      <Nav
        pages={[HOME, ABOUT]}
        currentPath="/"
        pageUrl={testPageUrl}
        portalUrl={testPortalUrl}
      />,
    );
    expect(
      screen.getByRole("link", { name: "Member Login" }).getAttribute("aria-current"),
    ).toBeNull();
  });
});
