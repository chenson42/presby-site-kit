import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DonateLink } from "../../src/components/DonateLink";

describe("DonateLink", () => {
  it("renders a safely-targeted external link", () => {
    render(<DonateLink label="Give" href="https://give.example.invalid/fillmore" />);
    const link = screen.getByRole("link", { name: "Give" });
    expect(link.getAttribute("href")).toBe("https://give.example.invalid/fillmore");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
