import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Nav, type NavEntry } from "../../src/components/Nav";
import { groupEntries } from "../../src/nav-grouping";
import { testPageUrl, testPortalUrl } from "../fixtures";

const HOME: NavEntry = {
  path: "/",
  label: "Home",
  href: testPageUrl("/"),
  group: null,
  highlight: false,
};
const ABOUT: NavEntry = {
  path: "/about",
  label: "About",
  href: testPageUrl("/about"),
  group: null,
  highlight: false,
};
const WORSHIP: NavEntry = {
  path: "/worship",
  label: "Worship",
  href: testPageUrl("/worship"),
  group: "Visit",
  highlight: false,
};
const MUSIC: NavEntry = {
  path: "/music",
  label: "Music",
  href: testPageUrl("/music"),
  group: "Visit",
  highlight: false,
};
const GIVE: NavEntry = {
  path: "/give",
  label: "Give",
  href: "https://give.example.invalid",
  group: null,
  highlight: true,
};

const baseProps = {
  logoUrl: null,
  logoAlt: "",
  organizationName: "Test Church",
  organizationHomeUrl: testPageUrl("/"),
  promoText: null,
};

describe("Nav — page links", () => {
  it("renders nothing with zero entries, no portal link, and no logo", () => {
    const { container } = render(
      <Nav entries={[]} currentPath="/hidden" portalUrl={null} {...baseProps} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("still renders when there's a logo, even with zero other content", () => {
    const { container } = render(
      <Nav
        entries={[]}
        currentPath="/"
        portalUrl={null}
        {...baseProps}
        logoUrl="https://cdn.example.invalid/logo.svg"
      />,
    );
    expect(container.querySelector('[data-slot="logo"] img')).not.toBeNull();
  });

  it("renders a link per top-level entry, in order, using the already-resolved href", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} {...baseProps} />);
    const links = screen.getAllByRole("link").filter((l) => l !== screen.queryByText("Test Church")?.closest("a"));
    expect(links.map((l) => l.textContent)).toEqual(["Home", "About"]);
  });

  it("marks the current page's link with aria-current, and no other", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/about" portalUrl={null} {...baseProps} />);
    expect(screen.getByRole("link", { name: "About" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });

  it("renders a highlighted entry with data-highlight=true", () => {
    render(<Nav entries={[HOME, GIVE]} currentPath="/" portalUrl={null} {...baseProps} />);
    const giveLi = screen.getByRole("link", { name: "Give" }).closest("li");
    expect(giveLi?.getAttribute("data-highlight")).toBe("true");
    expect(screen.getByRole("link", { name: "Give" }).getAttribute("href")).toBe(
      "https://give.example.invalid",
    );
  });

  it("renders a highlighted entry LAST -- after every dropdown group -- however its own navOrder sorts it in the flat entry list", () => {
    // The reference's own "Give" pill button always trails VISIT/CONNECT/
    // SERVE visually, even though GIVE carries the highest navOrder (a
    // flat-list sort position that, before this fix, rendered it FIRST
    // because Nav split entries into "top" vs "groups" as two independent
    // sequential blocks rather than respecting where a highlighted CTA
    // belongs relative to the groups).
    render(
      <Nav entries={[GIVE, WORSHIP, MUSIC]} currentPath="/" portalUrl={null} {...baseProps} />,
    );
    const items = screen.getAllByRole("listitem");
    const labels = items.map((li) => li.textContent);
    const giveIndex = labels.findIndex((t) => t?.includes("Give"));
    const groupIndex = labels.findIndex((t) => t?.includes("Visit"));
    expect(giveIndex).toBeGreaterThan(groupIndex);
  });
});

describe("Nav — dropdown groups", () => {
  it("groups entries sharing a `group` under one <details> with the group name as its summary", () => {
    render(
      <Nav entries={[HOME, WORSHIP, MUSIC]} currentPath="/" portalUrl={null} {...baseProps} />,
    );
    expect(screen.getByText("Visit").tagName).toBe("SUMMARY");
    expect(screen.getByRole("link", { name: "Worship" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Music" })).toBeTruthy();
  });

  it("a dropdown starts closed", () => {
    render(<Nav entries={[WORSHIP, MUSIC]} currentPath="/" portalUrl={null} {...baseProps} />);
    const details = screen.getByText("Visit").closest("details");
    expect(details?.open).toBe(false);
  });

  it("a mouse pointerenter opens the dropdown; pointerleave closes it", () => {
    render(<Nav entries={[WORSHIP, MUSIC]} currentPath="/" portalUrl={null} {...baseProps} />);
    const details = screen.getByText("Visit").closest("details") as HTMLDetailsElement;
    fireEvent.pointerEnter(details, { pointerType: "mouse" });
    expect(details.open).toBe(true);
    fireEvent.pointerLeave(details, { pointerType: "mouse" });
    expect(details.open).toBe(false);
  });

  it("a touch pointerenter does NOT open the dropdown — only click/tap does", () => {
    render(<Nav entries={[WORSHIP, MUSIC]} currentPath="/" portalUrl={null} {...baseProps} />);
    const details = screen.getByText("Visit").closest("details") as HTMLDetailsElement;
    fireEvent.pointerEnter(details, { pointerType: "touch" });
    expect(details.open).toBe(false);
  });

  it("clicking the summary toggles the dropdown open, then closed again", () => {
    render(<Nav entries={[WORSHIP, MUSIC]} currentPath="/" portalUrl={null} {...baseProps} />);
    const summary = screen.getByText("Visit");
    const details = summary.closest("details") as HTMLDetailsElement;
    fireEvent.click(summary);
    expect(details.open).toBe(true);
    fireEvent.click(summary);
    expect(details.open).toBe(false);
  });

  it("clicking a link inside a dropdown closes it", () => {
    render(<Nav entries={[WORSHIP, MUSIC]} currentPath="/" portalUrl={null} {...baseProps} />);
    const summary = screen.getByText("Visit");
    fireEvent.click(summary);
    fireEvent.click(screen.getByRole("link", { name: "Worship" }));
    expect((summary.closest("details") as HTMLDetailsElement).open).toBe(false);
  });
});

describe("Nav — logo, promo text", () => {
  it("renders an <img> logo linking to organizationHomeUrl when logoUrl is set", () => {
    const { container } = render(
      <Nav
        entries={[]}
        currentPath="/"
        portalUrl={null}
        {...baseProps}
        logoUrl="https://cdn.example.invalid/logo.svg"
      />,
    );
    const logoLink = container.querySelector('[data-slot="logo"]');
    expect(logoLink?.getAttribute("href")).toBe(testPageUrl("/"));
    expect(logoLink?.querySelector("img")?.getAttribute("src")).toBe(
      "https://cdn.example.invalid/logo.svg",
    );
  });

  it("falls back to the organization name as text when logoUrl is null", () => {
    const { container } = render(
      <Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} {...baseProps} />,
    );
    expect(container.querySelector('[data-slot="logo-text"]')?.textContent).toBe("Test Church");
  });

  it("renders promoText when set, omits it when null", () => {
    const { container, rerender } = render(
      <Nav
        entries={[]}
        currentPath="/"
        portalUrl={null}
        {...baseProps}
        logoUrl="https://cdn.example.invalid/logo.svg"
        promoText="Join us Sundays at 10:15 AM"
      />,
    );
    expect(container.querySelector('[data-slot="promo"]')?.textContent).toBe(
      "Join us Sundays at 10:15 AM",
    );
    rerender(
      <Nav
        entries={[]}
        currentPath="/"
        portalUrl={null}
        {...baseProps}
        logoUrl="https://cdn.example.invalid/logo.svg"
      />,
    );
    expect(container.querySelector('[data-slot="promo"]')).toBeNull();
  });
});

describe("Nav — member portal login link", () => {
  it("renders the login link even with zero entries — a one-page site still has members", () => {
    render(<Nav entries={[]} currentPath="/" portalUrl={testPortalUrl} {...baseProps} />);
    const link = screen.getByRole("link", { name: "Member Login" });
    expect(link.getAttribute("href")).toBe(testPortalUrl);
  });

  it("never gives the login link aria-current — it's a portal, not a page in this bundle", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={testPortalUrl} {...baseProps} />);
    expect(
      screen.getByRole("link", { name: "Member Login" }).getAttribute("aria-current"),
    ).toBeNull();
  });
});

describe("Nav — narrow-viewport collapse", () => {
  it("starts closed: aria-expanded false, the menu list carries data-open=\"false\"", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} {...baseProps} />);
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById("site-nav-menu")?.getAttribute("data-open")).toBe("false");
  });

  it("clicking the toggle opens the menu: aria-expanded true, data-open=\"true\", label flips to Close menu", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const toggle = screen.getByRole("button", { name: "Close menu" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById("site-nav-menu")?.getAttribute("data-open")).toBe("true");
  });

  it("clicking a page link after opening closes the menu again", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    fireEvent.click(screen.getByRole("link", { name: "About" }));
    expect(document.getElementById("site-nav-menu")?.getAttribute("data-open")).toBe("false");
  });
});

describe("Nav — scroll-hide/reveal", () => {
  it("hides the nav (data-hidden=true) when scrolling down past the threshold", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} {...baseProps} />);
    const nav = screen.getByRole("navigation");
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    fireEvent.scroll(window);
    Object.defineProperty(window, "scrollY", { value: 400, writable: true });
    fireEvent.scroll(window);
    expect(nav.getAttribute("data-hidden")).toBe("true");
  });

  it("never hides near the top of the page, even while scrolling down", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} {...baseProps} />);
    const nav = screen.getByRole("navigation");
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    fireEvent.scroll(window);
    Object.defineProperty(window, "scrollY", { value: 40, writable: true });
    fireEvent.scroll(window);
    expect(nav.getAttribute("data-hidden")).toBe("false");
  });

  it("reveals again (data-hidden=false) when scrolling back up", () => {
    render(<Nav entries={[HOME, ABOUT]} currentPath="/" portalUrl={null} {...baseProps} />);
    const nav = screen.getByRole("navigation");
    Object.defineProperty(window, "scrollY", { value: 0, writable: true });
    fireEvent.scroll(window);
    Object.defineProperty(window, "scrollY", { value: 400, writable: true });
    fireEvent.scroll(window);
    expect(nav.getAttribute("data-hidden")).toBe("true");
    Object.defineProperty(window, "scrollY", { value: 300, writable: true });
    fireEvent.scroll(window);
    expect(nav.getAttribute("data-hidden")).toBe("false");
  });
});

describe("groupEntries", () => {
  it("splits top-level (group: null) entries from grouped ones, preserving group insertion order", () => {
    const { top, groups } = groupEntries([HOME, WORSHIP, GIVE, MUSIC]);
    expect(top.map((e) => e.label)).toEqual(["Home", "Give"]);
    expect(groups).toEqual([{ group: "Visit", items: [WORSHIP, MUSIC] }]);
  });

  it("returns no groups for an all-top-level list", () => {
    expect(groupEntries([HOME, ABOUT]).groups).toEqual([]);
  });
});
