import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ALLOWED_BLOCK_TYPES, BLOCK_REGISTRY, type BlockRenderContext } from "../src/blocks";
import { emptyProfile, fullProfile, testImageUrl } from "./fixtures";

const baseCtx: BlockRenderContext = { imageUrl: testImageUrl, profile: null };

describe("ALLOWED_BLOCK_TYPES / BLOCK_REGISTRY", () => {
  it("lists exactly the design note's eleven block types", () => {
    expect([...ALLOWED_BLOCK_TYPES].sort()).toEqual(
      [
        "callout",
        "donateLink",
        "eventList",
        "featureGrid",
        "hero",
        "ministryList",
        "prose",
        "sermonEmbed",
        "serviceTimes",
        "staffList",
        "valuesGrid",
      ].sort(),
    );
  });

  it("has no entry for an unrecognized type", () => {
    expect(BLOCK_REGISTRY["totallyMadeUpBlockType"]).toBeUndefined();
    expect(BLOCK_REGISTRY["<script>"]).toBeUndefined();
  });
});

describe("individual block renderers — malformed props render nothing, not a throw", () => {
  it("hero: missing required `heading` renders null", () => {
    expect(BLOCK_REGISTRY.hero({ eyebrow: "hi" }, baseCtx)).toBeNull();
  });

  it("hero: valid props resolve the image manifestKey through ctx.imageUrl", () => {
    const element = BLOCK_REGISTRY.hero(
      { heading: "Welcome", image: "hero-banner" },
      baseCtx,
    );
    expect(element).not.toBeNull();
    const { container } = render(<>{element}</>);
    expect((container.querySelector("img") as HTMLImageElement).src).toBe(
      testImageUrl("hero-banner"),
    );
  });

  it("featureGrid: items missing a required field are dropped, not the whole block", () => {
    const element = BLOCK_REGISTRY.featureGrid(
      {
        items: [
          { heading: "Worship", body: "Sundays", href: "/worship" },
          { heading: "Missing body", href: "/oops" },
          "not even an object",
        ],
      },
      baseCtx,
    );
    expect(element).not.toBeNull();
    const { container } = render(<>{element}</>);
    expect(container.querySelectorAll("li").length).toBe(1);
  });

  it("featureGrid: an items array of entirely malformed entries renders null", () => {
    expect(
      BLOCK_REGISTRY.featureGrid({ items: [{ heading: "no body or href" }] }, baseCtx),
    ).toBeNull();
  });

  it("callout: cta is required — missing cta renders null", () => {
    expect(
      BLOCK_REGISTRY.callout({ heading: "Need help?", body: "We can help." }, baseCtx),
    ).toBeNull();
  });

  it("serviceTimes: ignores its own props and reads ctx.profile", () => {
    expect(BLOCK_REGISTRY.serviceTimes({}, { ...baseCtx, profile: emptyProfile })).toBeNull();
    expect(
      BLOCK_REGISTRY.serviceTimes({}, { ...baseCtx, profile: fullProfile }),
    ).not.toBeNull();
  });

  it("prose: an empty or whitespace-only body renders null", () => {
    expect(BLOCK_REGISTRY.prose({ body: "" }, baseCtx)).toBeNull();
    expect(BLOCK_REGISTRY.prose({ body: "   \n  " }, baseCtx)).toBeNull();
    expect(BLOCK_REGISTRY.prose({ body: "Hello" }, baseCtx)).not.toBeNull();
  });

  it("donateLink: a javascript: href is rejected, not sanitized-and-kept", () => {
    expect(
      BLOCK_REGISTRY.donateLink({ label: "Give", href: "javascript:alert(1)" }, baseCtx),
    ).toBeNull();
  });

  it("sermonEmbed: neither url set renders null", () => {
    expect(BLOCK_REGISTRY.sermonEmbed({}, baseCtx)).toBeNull();
  });
});
