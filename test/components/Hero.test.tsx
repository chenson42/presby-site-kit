import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "../../src/components/Hero";

describe("Hero", () => {
  it("renders every populated field", () => {
    render(
      <Hero
        eyebrow="Welcome"
        heading="Join us Sunday"
        tagline="A place for everyone"
        body="Worship, learn, and connect."
        imageUrl="https://cdn.example.invalid/hero.jpg"
        imageAlt="Congregation gathered in the sanctuary"
        cta={{ label: "Plan a visit", href: "/visit" }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Join us Sunday" })).toBeTruthy();
    expect(screen.getByText("Welcome")).toBeTruthy();
    expect(screen.getByText("A place for everyone")).toBeTruthy();
    expect(screen.getByText("Worship, learn, and connect.")).toBeTruthy();
    const image = screen.getByRole("img") as HTMLImageElement;
    expect(image.src).toBe("https://cdn.example.invalid/hero.jpg");
    expect(image.alt).toBe("Congregation gathered in the sanctuary");
    const cta = screen.getByRole("link", { name: "Plan a visit" }) as HTMLAnchorElement;
    expect(cta.getAttribute("href")).toBe("/visit");
  });

  it("omits every optional slot when not supplied", () => {
    const { container } = render(<Hero heading="Join us Sunday" />);
    expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.querySelector('[data-slot="eyebrow"]')).toBeNull();
    expect(container.querySelector('[data-slot="tagline"]')).toBeNull();
    expect(container.querySelector('[data-slot="body"]')).toBeNull();
  });

  it("applies headingClassName to the heading element", () => {
    render(<Hero heading="Join us Sunday" headingClassName="font-display" />);
    expect(screen.getByRole("heading", { level: 1 }).className).toBe("font-display");
  });
});
