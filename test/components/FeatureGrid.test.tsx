import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeatureGrid } from "../../src/components/FeatureGrid";

describe("FeatureGrid", () => {
  it("renders one card per item, each linking out", () => {
    render(
      <FeatureGrid
        items={[
          { heading: "Worship", body: "Sundays at 10:15", href: "/worship" },
          { heading: "Music", body: "Choir and handbells", href: "/music" },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Worship" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Music" })).toBeTruthy();
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href")).sort()).toEqual(["/music", "/worship"]);
  });

  it("renders nothing for an empty items array", () => {
    const { container } = render(<FeatureGrid items={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a card's optional image when set, with a decorative fallback alt", () => {
    const { container } = render(
      <FeatureGrid
        items={[
          { heading: "Worship", body: "Sundays at 10:15", href: "/worship", imageUrl: "https://cdn.example.invalid/worship.jpg" },
          { heading: "Music", body: "Choir and handbells", href: "/music" },
        ]}
      />,
    );
    // alt="" gives the image an accessible role of "presentation", not
    // "img" — querySelector, not getByRole, is the right tool here.
    const images = container.querySelectorAll("img");
    expect(images.length).toBe(1);
    expect((images[0] as HTMLImageElement).src).toBe("https://cdn.example.invalid/worship.jpg");
    expect((images[0] as HTMLImageElement).alt).toBe("");
  });

  it("uses the explicit imageAlt when supplied", () => {
    render(
      <FeatureGrid
        items={[
          {
            heading: "Worship",
            body: "Sundays at 10:15",
            href: "/worship",
            imageUrl: "https://cdn.example.invalid/worship.jpg",
            imageAlt: "The sanctuary during worship",
          },
        ]}
      />,
    );
    expect((screen.getByRole("img") as HTMLImageElement).alt).toBe(
      "The sanctuary during worship",
    );
  });
});
