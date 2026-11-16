import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  addressOneLine,
  normalizeEin,
  renderSiteBundle,
  serializeJsonLd,
  siteSettingsFor,
  type RenderSiteBundleInput,
  type SiteKitPage,
} from "../src/index";
import { fullProfile, testImageUrl, testPageUrl } from "./fixtures";

const SITE = {
  footerLine: "A council of the Example Church",
  footerLinks: [
    { label: "Contact us", href: "https://example.invalid/contact" },
    { label: "Bad", href: "javascript:alert(1)" },
    { label: "Relative", href: "/contact" },
    { label: "Protocol-relative", href: "//evil.example.invalid" },
  ],
  copyrightHolder: true,
  organization: {
    legalName: "Example Council Inc.",
    taxId: "000000000",
    nonprofitStatus: "Nonprofit501c3",
    parentOrganization: { name: "Example Church", url: "https://example.invalid" },
    sameAs: ["https://example.invalid/old", "http://insecure.example.invalid"],
  },
};

function pages(site: unknown, extraFm: Record<string, unknown> = {}): SiteKitPage[] {
  return [
    { path: "/", frontMatter: { title: "Home", ...extraFm, ...(site ? { site } : {}) }, mdxAst: { blocks: [] } },
    { path: "/about", frontMatter: { title: "About" }, mdxAst: { blocks: [] } },
  ];
}

function input(overrides: Partial<RenderSiteBundleInput> = {}): RenderSiteBundleInput {
  return {
    pages: pages(SITE),
    currentPath: "/",
    brand: null,
    imageUrl: testImageUrl,
    pageUrl: testPageUrl,
    portalUrl: null,
    profile: { ...fullProfile, address: "100 Placeholder Way\r\nSuite B,\n\nFillmore, ZZ 00000" },
    logoUrl: null,
    organizationName: "Fixture Council",
    origin: "https://fixture.example.invalid",
    ...overrides,
  };
}

function jsonLd(container: HTMLElement): Record<string, unknown> | null {
  const script = container.querySelector('script[type="application/ld+json"]');
  return script ? (JSON.parse(script.textContent ?? "") as Record<string, unknown>) : null;
}

describe("site settings (v4.5.0)", () => {
  it("a site without `site` renders the same markup as before", () => {
    const without = input({ pages: pages(null) });
    const html = render(renderSiteBundle(without)!).container.innerHTML;
    expect(html).toContain("All rights reserved");
    expect(html).not.toContain("footer-line");
    expect(html).not.toContain("footer-links");
    expect(html).not.toContain("ld+json");
  });

  it("a single-line address renders exactly as before", () => {
    const html = render(
      renderSiteBundle(input({ pages: pages(null), profile: { ...fullProfile, address: "1 Main St, Anytown" } }))!,
    ).container.innerHTML;
    expect(html).toContain('<p data-slot="address">1 Main St, Anytown</p>');
  });

  it("renders the footer line, safe links only, and the organization in the © line", () => {
    const { container } = render(renderSiteBundle(input())!);
    expect(container.querySelector('[data-slot="footer-line"]')?.textContent).toBe(
      "A council of the Example Church",
    );
    const links = Array.from(container.querySelectorAll('[data-slot="footer-links"] a'));
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://example.invalid/contact"]);
    expect(container.querySelector('[data-slot="footer-bottom"] p')?.textContent).toMatch(
      /^© \d{4} Fixture Council$/,
    );
  });

  it("a string copyrightHolder overrides the organization name", () => {
    const { container } = render(
      renderSiteBundle(input({ pages: pages({ copyrightHolder: "Example Council Inc." }) }))!,
    );
    expect(container.querySelector('[data-slot="footer-bottom"] p')?.textContent).toMatch(
      /Example Council Inc\.$/,
    );
  });

  it("applies the home page's settings to every page", () => {
    const { container } = render(renderSiteBundle(input({ currentPath: "/about" }))!);
    expect(container.querySelector('[data-slot="footer-line"]')).not.toBeNull();
  });

  it("renders the address on separate lines, dropping blanks", () => {
    const { container } = render(renderSiteBundle(input())!);
    const address = container.querySelector('[data-slot="address"]')!;
    expect(address.querySelectorAll("br")).toHaveLength(2);
    expect(address.textContent).toBe("100 Placeholder WaySuite B,Fillmore, ZZ 00000");
  });

  it("joins address lines for the maps link without doubling commas", () => {
    expect(addressOneLine("100 Placeholder Way\nSuite B,\n\nFillmore, ZZ 00000")).toBe(
      "100 Placeholder Way, Suite B, Fillmore, ZZ 00000",
    );
    const { container } = render(renderSiteBundle(input())!);
    const href = container.querySelector('[data-slot="directions-button"]')!.getAttribute("href")!;
    expect(decodeURIComponent(href)).toContain("query=100 Placeholder Way, Suite B, Fillmore, ZZ 00000");
  });

  it("a footer with only site content still renders (hideMenu, no profile)", () => {
    const { container } = render(
      renderSiteBundle(input({ profile: null, pages: pages({ footerLine: "Hello" }, { hideMenu: true }) }))!,
    );
    expect(container.querySelector('[data-slot="footer-line"]')?.textContent).toBe("Hello");
  });

  it("emits Organization JSON-LD on the home page only, from allowlisted fields", () => {
    const home = render(renderSiteBundle(input())!);
    expect(jsonLd(home.container)).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Fixture Council",
      legalName: "Example Council Inc.",
      url: "https://fixture.example.invalid/site/fixture-hollow",
      address: {
        "@type": "PostalAddress",
        streetAddress: "100 Placeholder Way, Suite B, Fillmore, ZZ 00000",
      },
      telephone: fullProfile.phone,
      taxID: "00-0000000",
      nonprofitStatus: "https://schema.org/Nonprofit501c3",
      parentOrganization: { "@type": "Organization", name: "Example Church", url: "https://example.invalid/" },
      sameAs: ["https://example.invalid/old"],
    });
    const about = render(renderSiteBundle(input({ currentPath: "/about" }))!);
    expect(jsonLd(about.container)).toBeNull();
  });

  it("no organization key means no JSON-LD", () => {
    const { container } = render(renderSiteBundle(input({ pages: pages({ footerLine: "x" }) }))!);
    expect(jsonLd(container)).toBeNull();
  });

  it("content cannot break out of the script element", () => {
    const evil = "</script><script>alert(1)</script>\u2028&";
    const { container } = render(
      renderSiteBundle(
        input({
          organizationName: evil,
          pages: pages({ organization: { legalName: evil } }),
        }),
      )!,
    );
    const body = container.querySelector('script[type="application/ld+json"]')!.innerHTML;
    expect(body).not.toContain("<");
    expect(JSON.parse(body).legalName).toBe(evil);
    expect(serializeJsonLd({ a: "</script>" })).toBe('{"a":"\\u003c/script\\u003e"}');
  });

  it("validates the EIN and the nonprofit status", () => {
    expect(normalizeEin("00-0000000")).toBe("00-0000000");
    expect(normalizeEin("000000000")).toBe("00-0000000");
    expect(normalizeEin("12-34")).toBeNull();
    expect(normalizeEin(123456789)).toBeNull();
    const s = siteSettingsFor(pages({ organization: { taxId: "bad", nonprofitStatus: "Charity" } }));
    expect(s.organization).toMatchObject({ taxId: null, nonprofitStatus: null });
  });

  it("caps footer links at four", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ label: `L${i}`, href: `https://example.invalid/${i}` }));
    expect(siteSettingsFor(pages({ footerLinks: many })).footerLinks).toHaveLength(4);
  });
});
