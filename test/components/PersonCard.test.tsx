import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonCard } from "../../src/components/PersonCard";

describe("PersonCard", () => {
  it("renders name, title, and photo when set", () => {
    render(
      <PersonCard
        name="Alex Rivera"
        title="Pastor"
        photoUrl="https://cdn.example.invalid/alex.jpg"
      />,
    );
    expect(screen.getByRole("heading", { level: 3, name: "Alex Rivera" })).toBeTruthy();
    expect(screen.getByText("Pastor")).toBeTruthy();
    expect((screen.getByRole("img") as HTMLImageElement).alt).toBe("Alex Rivera");
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(
      "https://cdn.example.invalid/alex.jpg",
    );
  });

  it("omits the photo and title when unset, without omitting the person", () => {
    const { container } = render(<PersonCard name="Jordan Lee" />);
    expect(screen.getByText("Jordan Lee")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector('[data-slot="title"]')).toBeNull();
  });

  it("has no phone/email prop on its own type -- a live caller cannot pass contact fields at all", () => {
    // Structural, not behavioral: PersonCardProps carries no phone/email
    // field, unlike StaffPerson's dual-trust-tier shape. This test exists
    // to document the intent at the component's own test file, matching
    // this repo's per-component convention; TypeScript itself is the real
    // enforcement (a `phone`/`email` prop would fail to typecheck).
    render(<PersonCard name="Sam Okafor" title="Clerk of Session" />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("applies headingClassName and className when provided", () => {
    const { container } = render(
      <PersonCard
        name="Robin Ashworth"
        headingClassName="font-display"
        className="person-card--leadership"
      />,
    );
    expect(screen.getByRole("heading", { level: 3 }).className).toBe("font-display");
    expect(container.querySelector('[data-block="person-card"]')?.className).toBe(
      "person-card--leadership",
    );
  });

  it("renders inside a standalone div, not an <li> -- distinct container contract from StaffList", () => {
    const { container } = render(<PersonCard name="Taylor Kwan" />);
    const root = container.querySelector('[data-block="person-card"]');
    expect(root?.tagName).toBe("DIV");
  });
});
