import { describe, expect, it } from "vitest";
import { asHexColor, toTrustedEmbedUrl } from "../src/utils";

describe("asHexColor", () => {
  it("accepts a valid #rrggbb", () => {
    expect(asHexColor("#42714f")).toBe("#42714f");
  });
  it("rejects a named color, rgb(), and injection attempts", () => {
    expect(asHexColor("green")).toBeNull();
    expect(asHexColor("rgb(0,0,0)")).toBeNull();
    expect(asHexColor("#fff")).toBeNull();
    expect(asHexColor("#42714f; } body { display: none")).toBeNull();
    expect(asHexColor(null)).toBeNull();
  });
});

describe("toTrustedEmbedUrl", () => {
  it("normalizes a youtube watch URL to youtube-nocookie embed", () => {
    expect(toTrustedEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });
  it("normalizes a youtu.be short link", () => {
    expect(toTrustedEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });
  it("handles a playlist-only URL (live-stream archive pattern)", () => {
    const out = toTrustedEmbedUrl(
      "https://www.youtube.com/playlist?list=UUKLPT8B3cdiYeE9aVgNzcBQ",
    );
    expect(out).toBe(
      "https://www.youtube-nocookie.com/embed/videoseries?list=UUKLPT8B3cdiYeE9aVgNzcBQ",
    );
  });
  it("normalizes a vimeo URL", () => {
    expect(toTrustedEmbedUrl("https://vimeo.com/76979871")).toBe(
      "https://player.vimeo.com/video/76979871",
    );
  });
  it("rejects an untrusted host", () => {
    expect(toTrustedEmbedUrl("https://evil.example.com/embed/x")).toBeNull();
  });
  it("rejects a non-https protocol", () => {
    expect(toTrustedEmbedUrl("javascript:alert(1)")).toBeNull();
  });
  it("rejects a malformed/oversized video id (injection attempt via id)", () => {
    expect(
      toTrustedEmbedUrl("https://www.youtube.com/watch?v=" + "a".repeat(200)),
    ).toBeNull();
  });
  it("rejects garbage input", () => {
    expect(toTrustedEmbedUrl("not a url")).toBeNull();
    expect(toTrustedEmbedUrl(null)).toBeNull();
  });
});
