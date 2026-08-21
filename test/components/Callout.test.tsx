import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Callout } from "../../src/components/Callout";

describe("Callout", () => {
  it("renders heading, body, image, and the required cta", () => {
    render(
      <Callout
        heading="Need medical equipment?"
        body="Our lending closet is open Tuesdays."
        imageUrl="https://cdn.example.invalid/closet.jpg"
        imageAlt="Shelves of donated equipment"
        cta={{ label: "Learn more", href: "/programs/lending-closet" }}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Need medical equipment?" })).toBeTruthy();
    expect(screen.getByText("Our lending closet is open Tuesdays.")).toBeTruthy();
    const image = screen.getByRole("img") as HTMLImageElement;
    expect(image.alt).toBe("Shelves of donated equipment");
    expect(screen.getByRole("link", { name: "Learn more" }).getAttribute("href")).toBe(
      "/programs/lending-closet",
    );
  });

  it("omits the image entirely when none is supplied", () => {
    const { container } = render(
      <Callout
        heading="Need medical equipment?"
        body="Our lending closet is open Tuesdays."
        cta={{ label: "Learn more", href: "/programs/lending-closet" }}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
