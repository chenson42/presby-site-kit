import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Prose } from "../../src/components/Prose";

describe("Prose", () => {
  it("renders headings, paragraphs, and lists", () => {
    const { container } = render(
      <Prose
        body={[
          "## Our Story",
          "",
          "We started as a mission church in 1962.",
          "",
          "- Founded 1962",
          "- Sanctuary built 1975",
        ].join("\n")}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Our Story" })).toBeTruthy();
    expect(screen.getByText("We started as a mission church in 1962.")).toBeTruthy();
    const items = container.querySelectorAll("li");
    expect(Array.from(items).map((li) => li.textContent)).toEqual([
      "Founded 1962",
      "Sanctuary built 1975",
    ]);
  });

  it("renders bold, italic, and link inline markup", () => {
    const { container } = render(
      <Prose body="Come **worship** with us, *rain or shine* — [plan a visit](/visit)." />,
    );
    expect(container.querySelector("strong")?.textContent).toBe("worship");
    expect(container.querySelector("em")?.textContent).toBe("rain or shine");
    const link = container.querySelector("a");
    expect(link?.textContent).toBe("plan a visit");
    expect(link?.getAttribute("href")).toBe("/visit");
  });

  it("rejects a javascript: link target", () => {
    const { container } = render(
      <Prose body="[click here](javascript:alert(1))" />,
    );
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("click here");
  });

  it("ADVERSARIAL: a script tag in body text renders as inert text, never as markup", () => {
    const malicious =
      '<script>window.__pwned = true;</script> and <img src=x onerror="window.__pwned = true">';
    const { container } = render(<Prose body={malicious} />);

    // No script element was created — React text nodes, not innerHTML.
    expect(container.querySelector("script")).toBeNull();
    // No injected <img> either — the string is inert text, not parsed HTML.
    expect(container.querySelector("img")).toBeNull();
    // The literal characters are visible as text content, not executed.
    expect(container.textContent).toContain("<script>window.__pwned = true;</script>");
    expect(container.textContent).toContain(
      '<img src=x onerror="window.__pwned = true">',
    );
    // And, decisively: nothing on the page actually ran.
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it("ADVERSARIAL: a script tag inside a heading/list line is equally inert", () => {
    const { container } = render(
      <Prose body={"## <img src=x onerror=alert(1)>\n\n- <script>alert(2)</script>"} />,
    );
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("h2")?.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("renders a `---` line as a real <hr>, not a heading or paragraph", () => {
    const { container } = render(
      <Prose body={"### How to borrow\n\nCall us.\n\n---\n\n### Our process\n\nWe sanitize items."} />,
    );
    const hrs = container.querySelectorAll("hr");
    expect(hrs.length).toBe(1);
    // The rule is a sibling between the two sections, not swallowed into
    // either paragraph or heading text.
    expect(container.textContent).not.toContain("---");
  });

  it("stamps data-columns only for the 2/3 values renderProseBlock allows, not arbitrary numbers", () => {
    const two = render(<Prose body="x" columns={2} />);
    expect(two.container.querySelector('[data-block="prose"]')?.getAttribute("data-columns")).toBe(
      "2",
    );
    const bogus = render(<Prose body="x" columns={5} />);
    expect(
      bogus.container.querySelector('[data-block="prose"]')?.hasAttribute("data-columns"),
    ).toBe(false);
  });

  it("applies headingColor as the --md-heading-color custom property, not inline element color", () => {
    const { container } = render(<Prose body="## Heading" headingColor="#42714f" />);
    const el = container.querySelector('[data-block="prose"]') as HTMLElement;
    expect(el.style.getPropertyValue("--md-heading-color")).toBe("#42714f");
    // The heading itself carries no inline color -- CSS reads the variable.
    expect(container.querySelector("h2")?.getAttribute("style")).toBeNull();
  });
});
