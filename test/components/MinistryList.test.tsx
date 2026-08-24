import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MinistryList } from "../../src/components/MinistryList";

describe("MinistryList", () => {
  it("renders every item", () => {
    render(
      <MinistryList
        items={[
          { heading: "Food Pantry", body: "Second Saturdays, 9 a.m." },
          { heading: "Youth Group", body: "Sundays after worship." },
        ]}
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Food Pantry" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Youth Group" })).toBeTruthy();
  });

  it("renders nothing for an empty items array", () => {
    const { container } = render(<MinistryList items={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders an item's optional image, and omits the image entirely when unset", () => {
    const { container } = render(
      <MinistryList
        items={[
          {
            heading: "Food Pantry",
            body: "Second Saturdays, 9 a.m.",
            imageUrl: "https://cdn.example.invalid/pantry.jpg",
          },
          { heading: "Youth Group", body: "Sundays after worship." },
        ]}
      />,
    );
    const images = container.querySelectorAll("img");
    expect(images.length).toBe(1);
    expect((images[0] as HTMLImageElement).src).toBe(
      "https://cdn.example.invalid/pantry.jpg",
    );
  });
});
