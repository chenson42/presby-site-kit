import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SermonEmbed } from "../../src/components/SermonEmbed";

describe("SermonEmbed", () => {
  it("renders both links when both are set", () => {
    render(
      <SermonEmbed liveUrl="https://live.example.invalid" archiveUrl="https://archive.example.invalid" />,
    );
    expect(screen.getByRole("link", { name: "Watch live" }).getAttribute("href")).toBe(
      "https://live.example.invalid",
    );
    expect(screen.getByRole("link", { name: "Watch past services" }).getAttribute("href")).toBe(
      "https://archive.example.invalid",
    );
  });

  it("renders only the link that is set", () => {
    const { container } = render(<SermonEmbed liveUrl="https://live.example.invalid" />);
    expect(container.querySelectorAll("a").length).toBe(1);
  });

  it("renders nothing when neither url is set", () => {
    const { container } = render(<SermonEmbed />);
    expect(container.innerHTML).toBe("");
  });
});
