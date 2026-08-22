import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Nav } from "../../src/components/Nav";
import { testPageUrl } from "../fixtures";
import type { SiteKitPage } from "../../src/types";

const HOME: SiteKitPage = { path: "/", frontMatter: { navLabel: "Home" }, mdxAst: {} };
const ABOUT: SiteKitPage = { path: "/about", frontMatter: { navLabel: "About" }, mdxAst: {} };
const NO_NAV: SiteKitPage = { path: "/hidden", frontMatter: {}, mdxAst: {} };

describe("Nav", () => {
  it("renders nothing with zero navigable pages", () => {
    const { container } = render(
      <Nav pages={[NO_NAV]} currentPath="/hidden" pageUrl={testPageUrl} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing with exactly one navigable page — nothing to navigate to", () => {
    const { container } = render(
      <Nav pages={[HOME, NO_NAV]} currentPath="/" pageUrl={testPageUrl} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders a link per page with a navLabel, in bundle order, omitting pages without one", () => {
    render(<Nav pages={[HOME, NO_NAV, ABOUT]} currentPath="/" pageUrl={testPageUrl} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Home", "About"]);
    expect(links[0]?.getAttribute("href")).toBe(testPageUrl("/"));
    expect(links[1]?.getAttribute("href")).toBe(testPageUrl("/about"));
  });

  it("marks the current page's link with aria-current, and no other", () => {
    render(<Nav pages={[HOME, ABOUT]} currentPath="/about" pageUrl={testPageUrl} />);
    expect(screen.getByRole("link", { name: "About" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });

  it("ignores a non-string navLabel rather than throwing or rendering it", () => {
    const weird: SiteKitPage = { path: "/weird", frontMatter: { navLabel: 42 }, mdxAst: {} };
    const { container } = render(
      <Nav pages={[HOME, weird]} currentPath="/" pageUrl={testPageUrl} />,
    );
    // Only one real navLabel ("Home") — still below the two-entry threshold.
    expect(container.innerHTML).toBe("");
  });
});
