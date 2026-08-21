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
});
