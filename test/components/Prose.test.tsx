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
});
