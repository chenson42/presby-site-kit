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

  it("prefers archiveUrl as the real embedded player when it's a trusted YouTube URL, and suppresses the redundant archive link", () => {
    const { container } = render(
      <SermonEmbed
        liveUrl="https://www.youtube.com/channel/UCabc123/live"
        archiveUrl="https://www.youtube.com/playlist?list=PLdQw4w9WgXcQ1234567890"
      />,
    );
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/videoseries?list=PLdQw4w9WgXcQ1234567890",
    );
    // archiveUrl became the embed, so no redundant "Watch past services" link.
    expect(screen.queryByRole("link", { name: "Watch past services" })).toBeNull();
    // liveUrl isn't embeddable (a bare /live channel URL has no video/list
    // id) -- it stays a real link-out.
    expect(screen.getByRole("link", { name: "Watch live" })).toBeTruthy();
  });

  it("falls back to embedding liveUrl when archiveUrl doesn't resolve to a trusted embed", () => {
    const { container } = render(
      <SermonEmbed
        liveUrl="https://youtu.be/dQw4w9WgXcQ"
        archiveUrl="https://not-a-real-video-host.example.invalid/watch"
      />,
    );
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(screen.queryByRole("link", { name: "Watch live" })).toBeNull();
    // archiveUrl never resolved -- still offered as a plain (unembedded) link.
    expect(screen.getByRole("link", { name: "Watch past services" })).toBeTruthy();
  });

  it("renders the description as a caption when provided", () => {
    render(
      <SermonEmbed
        liveUrl="https://live.example.invalid"
        description="Watch our latest Sunday service live, or browse the archive."
      />,
    );
    expect(
      screen.getByText("Watch our latest Sunday service live, or browse the archive."),
    ).toBeTruthy();
  });
});
