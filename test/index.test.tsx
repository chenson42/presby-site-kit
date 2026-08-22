import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderSiteBundle, type RenderSiteBundleInput, type SiteKitPage } from "../src/index";
import { emptyProfile, fullProfile, testImageUrl, testPageUrl } from "./fixtures";

function baseInput(overrides: Partial<RenderSiteBundleInput> = {}): RenderSiteBundleInput {
  return {
    pages: [],
    currentPath: "/",
    brand: null,
    imageUrl: testImageUrl,
    pageUrl: testPageUrl,
    profile: null,
    ...overrides,
  };
}

const homePage: SiteKitPage = {
  path: "/",
  frontMatter: { title: "Home" },
  mdxAst: {
    blocks: [
      {
        type: "hero",
        props: { heading: "Join us Sunday", tagline: "A place for everyone" },
      },
      {
        type: "featureGrid",
        props: {
          items: [
            { heading: "Worship", body: "Sundays at 10:15", href: "/worship" },
            { heading: "Music", body: "Choir and handbells", href: "/music" },
          ],
        },
      },
    ],
  },
};

describe("renderSiteBundle — page lookup", () => {
  it("returns null when no page matches currentPath (caller calls notFound())", () => {
    expect(renderSiteBundle(baseInput({ pages: [homePage], currentPath: "/nowhere" }))).toBeNull();
  });
});

describe("renderSiteBundle — composition", () => {
  it("composes Hero + FeatureGrid + Footer together on the matched page", () => {
    const element = renderSiteBundle(
      baseInput({ pages: [homePage], currentPath: "/", profile: fullProfile }),
    );
    expect(element).not.toBeNull();
    render(<>{element}</>);

    expect(screen.getByRole("heading", { level: 1, name: "Join us Sunday" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Worship" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Music" })).toBeTruthy();
    expect(document.querySelector("footer")).not.toBeNull();
    expect(document.querySelector('[data-slot="address"]')).not.toBeNull();
  });

  it("omits Footer entirely when profile is null, without affecting block rendering", () => {
    render(<>{renderSiteBundle(baseInput({ pages: [homePage], currentPath: "/", profile: null }))}</>);
    expect(screen.getByRole("heading", { level: 1, name: "Join us Sunday" })).toBeTruthy();
    expect(document.querySelector("footer")).toBeNull();
  });

  it("applies brand font-pairing classes to body wrapper and block headings", () => {
    const { container } = render(
      <>
        {renderSiteBundle(
          baseInput({
            pages: [homePage],
            currentPath: "/",
            brand: {
              tokens: {},
              fontPairing: { bodyClassName: "font-body", headingClassName: "font-heading" },
            },
          }),
        )}
      </>,
    );
    expect(container.querySelector('[class="font-body"]')).not.toBeNull();
    expect(screen.getByRole("heading", { level: 1 }).className).toBe("font-heading");
  });
});

describe("renderSiteBundle — malformed/hostile input never throws", () => {
  it("skips a block whose type isn't in the allowlist", () => {
    const page: SiteKitPage = {
      path: "/",
      frontMatter: {},
      mdxAst: {
        blocks: [
          { type: "rawScriptInjection", props: { script: "<script>alert(1)</script>" } },
          { type: "prose", props: { body: "Still here." } },
        ],
      },
    };
    const { container } = render(
      <>{renderSiteBundle(baseInput({ pages: [page], currentPath: "/" }))}</>,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("Still here.");
  });

  it("renders no body content for a legacy v0.0.1-stub {raw} mdxAst shape, without throwing", () => {
    const legacyPage: SiteKitPage = {
      path: "/",
      frontMatter: { title: "Old page" },
      mdxAst: { raw: "# Old MDX body text" },
    };
    expect(() =>
      render(<>{renderSiteBundle(baseInput({ pages: [legacyPage], currentPath: "/" }))}</>),
    ).not.toThrow();
    expect(screen.queryByText(/Old MDX body text/)).toBeNull();
  });

  it("renders no body content when mdxAst is entirely absent", () => {
    const noBlocksPage: SiteKitPage = { path: "/", frontMatter: {}, mdxAst: undefined };
    expect(() =>
      render(<>{renderSiteBundle(baseInput({ pages: [noBlocksPage], currentPath: "/" }))}</>),
    ).not.toThrow();
  });

  it("skips an individual block whose props are malformed while still rendering the rest", () => {
    const page: SiteKitPage = {
      path: "/",
      frontMatter: {},
      mdxAst: {
        blocks: [
          { type: "hero", props: {} }, // missing required heading
          { type: "prose", props: { body: "Survives." } },
        ],
      },
    };
    render(<>{renderSiteBundle(baseInput({ pages: [page], currentPath: "/" }))}</>);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.getByText("Survives.")).toBeTruthy();
  });
});

describe("renderSiteBundle — Nav composition", () => {
  const aboutPage: SiteKitPage = {
    path: "/about",
    frontMatter: { title: "About", navLabel: "About" },
    mdxAst: { blocks: [{ type: "prose", props: { body: "About us." } }] },
  };
  const homeWithNav: SiteKitPage = {
    ...homePage,
    frontMatter: { ...homePage.frontMatter, navLabel: "Home" },
  };

  it("renders Nav above the page blocks when two or more pages opt in via navLabel", () => {
    render(
      <>
        {renderSiteBundle(
          baseInput({ pages: [homeWithNav, aboutPage], currentPath: "/" }),
        )}
      </>,
    );
    expect(screen.getByRole("navigation", { name: "Site" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "About" })).toBeTruthy();
  });

  it("omits Nav entirely for a single-page bundle", () => {
    render(<>{renderSiteBundle(baseInput({ pages: [homeWithNav], currentPath: "/" }))}</>);
    expect(screen.queryByRole("navigation", { name: "Site" })).toBeNull();
  });

  it("a page not in the bundle still 404s (returns null) even though Nav would otherwise render", () => {
    expect(
      renderSiteBundle(
        baseInput({ pages: [homeWithNav, aboutPage], currentPath: "/nowhere" }),
      ),
    ).toBeNull();
  });
});

describe("renderSiteBundle — profile null-safety extends to the serviceTimes block", () => {
  it("omits the serviceTimes block when profile is null", () => {
    const page: SiteKitPage = {
      path: "/",
      frontMatter: {},
      mdxAst: { blocks: [{ type: "serviceTimes", props: {} }] },
    };
    const { container } = render(
      <>{renderSiteBundle(baseInput({ pages: [page], currentPath: "/", profile: null }))}</>,
    );
    expect(container.querySelector('[data-block="service-times"]')).toBeNull();
  });

  it("omits the serviceTimes block when profile has an empty serviceTimes array", () => {
    const page: SiteKitPage = {
      path: "/",
      frontMatter: {},
      mdxAst: { blocks: [{ type: "serviceTimes", props: {} }] },
    };
    const { container } = render(
      <>{renderSiteBundle(baseInput({ pages: [page], currentPath: "/", profile: emptyProfile }))}</>,
    );
    expect(container.querySelector('[data-block="service-times"]')).toBeNull();
  });

  it("renders the serviceTimes block when profile has entries", () => {
    const page: SiteKitPage = {
      path: "/",
      frontMatter: {},
      mdxAst: { blocks: [{ type: "serviceTimes", props: {} }] },
    };
    const { container } = render(
      <>{renderSiteBundle(baseInput({ pages: [page], currentPath: "/", profile: fullProfile }))}</>,
    );
    expect(container.querySelector('[data-block="service-times"]')).not.toBeNull();
  });
});
