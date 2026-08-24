import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ValuesGrid } from "../../src/components/ValuesGrid";

describe("ValuesGrid", () => {
  it("renders every item", () => {
    render(
      <ValuesGrid
        items={[
          { heading: "Purposeful", body: "We show up with intention." },
          { heading: "Personal", body: "We know each other's names." },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Purposeful" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Personal" })).toBeTruthy();
  });

  it("renders nothing for an empty items array", () => {
    const { container } = render(<ValuesGrid items={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders an item's optional image, and omits the image entirely when unset", () => {
    const { container } = render(
      <ValuesGrid
        items={[
          {
            heading: "Purposeful",
            body: "We show up with intention.",
            imageUrl: "https://cdn.example.invalid/purposeful.jpg",
          },
          { heading: "Personal", body: "We know each other's names." },
        ]}
      />,
    );
    const images = container.querySelectorAll("img");
    expect(images.length).toBe(1);
    expect((images[0] as HTMLImageElement).src).toBe(
      "https://cdn.example.invalid/purposeful.jpg",
    );
  });
});
