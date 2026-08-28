import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ALLOWED_BLOCK_TYPES, BLOCK_REGISTRY, type BlockRenderContext } from "../src/blocks";
import { emptyProfile, fullProfile, testImageUrl, testPageUrl } from "./fixtures";

const baseCtx: BlockRenderContext = {
  imageUrl: testImageUrl,
  pageUrl: testPageUrl,
  profile: null,
};

describe("ALLOWED_BLOCK_TYPES / BLOCK_REGISTRY", () => {
  it("lists the design note's eleven block types plus gallery, contactForm, and liveSlot", () => {
    expect([...ALLOWED_BLOCK_TYPES].sort()).toEqual(
      [
        "callout",
        "contactForm",
        "donateLink",
        "eventList",
        "featureGrid",
        "gallery",
        "hero",
        "liveSlot",
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

  it("featureGrid: a bundle-relative href resolves through ctx.pageUrl, not the raw path — a raw `/worship` would 404 against presby's own site root instead of this bundle's `/site/<slug>/worship`", () => {
    const element = BLOCK_REGISTRY.featureGrid(
      { items: [{ heading: "Worship", body: "Sundays", href: "/worship" }] },
      baseCtx,
    );
    const { container } = render(<>{element}</>);
    expect(container.querySelector("a")?.getAttribute("href")).toBe(testPageUrl("/worship"));
  });

  it("featureGrid: an external href passes through unresolved", () => {
    const element = BLOCK_REGISTRY.featureGrid(
      { items: [{ heading: "Give", body: "External", href: "https://give.example.invalid" }] },
      baseCtx,
    );
    const { container } = render(<>{element}</>);
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "https://give.example.invalid",
    );
  });

  it("callout: cta is OPTIONAL — the reference site's own \"Stay in touch\" section has no button", () => {
    const element = BLOCK_REGISTRY.callout(
      { heading: "Need help?", body: "We can help." },
      baseCtx,
    );
    expect(element).not.toBeNull();
  });

  it("callout: heading or body missing still renders null", () => {
    expect(BLOCK_REGISTRY.callout({ body: "We can help." }, baseCtx)).toBeNull();
    expect(BLOCK_REGISTRY.callout({ heading: "Need help?" }, baseCtx)).toBeNull();
  });

  it("callout: cta href resolves through ctx.pageUrl", () => {
    const element = BLOCK_REGISTRY.callout(
      {
        heading: "Need help?",
        body: "We can help.",
        cta: { label: "See ministries", href: "/ministries" },
      },
      baseCtx,
    );
    const { container } = render(<>{element}</>);
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      testPageUrl("/ministries"),
    );
  });

  it("hero: cta href resolves through ctx.pageUrl", () => {
    const element = BLOCK_REGISTRY.hero(
      { heading: "Welcome", cta: { label: "Plan a visit", href: "/about" } },
      baseCtx,
    );
    const { container } = render(<>{element}</>);
    expect(container.querySelector("a")?.getAttribute("href")).toBe(testPageUrl("/about"));
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

  it("prose: fullWidth: true threads through to data-full-width; anything else does not set it", () => {
    const wide = render(<>{BLOCK_REGISTRY.prose({ body: "Hello", fullWidth: true }, baseCtx)}</>);
    expect(
      wide.container.querySelector('[data-block="prose"]')?.getAttribute("data-full-width"),
    ).toBe("true");
    const narrow = render(<>{BLOCK_REGISTRY.prose({ body: "Hello", fullWidth: "true" }, baseCtx)}</>);
    expect(
      narrow.container.querySelector('[data-block="prose"]')?.hasAttribute("data-full-width"),
    ).toBe(false);
  });

  it("donateLink: a javascript: href is rejected, not sanitized-and-kept", () => {
    expect(
      BLOCK_REGISTRY.donateLink({ label: "Give", href: "javascript:alert(1)" }, baseCtx),
    ).toBeNull();
  });

  it("sermonEmbed: neither url set renders null", () => {
    expect(BLOCK_REGISTRY.sermonEmbed({}, baseCtx)).toBeNull();
  });

  it("contactForm: skips entirely when the caller never wires ctx.contactForm, even with valid props", () => {
    expect(
      BLOCK_REGISTRY.contactForm({ heading: "Contact" }, baseCtx),
    ).toBeNull();
  });

  it("contactForm: missing heading renders null even when ctx.contactForm is present", () => {
    const ctxWithForm: BlockRenderContext = {
      ...baseCtx,
      contactForm: <form data-testid="the-real-form" />,
    };
    expect(BLOCK_REGISTRY.contactForm({}, ctxWithForm)).toBeNull();
  });

  it("contactForm: renders the caller's real form element plus heading/intro/aside, data-has-aside stamped only when aside is present", () => {
    const ctxWithForm: BlockRenderContext = {
      ...baseCtx,
      contactForm: <form data-testid="the-real-form" />,
    };
    const withAside = render(
      <>
        {BLOCK_REGISTRY.contactForm(
          {
            heading: "Contact",
            intro: "Send us a message.",
            aside: "#### Address\n\n123 Main St",
            headingColor: "#42714f",
          },
          ctxWithForm,
        )}
      </>,
    );
    expect(withAside.getByTestId("the-real-form")).toBeTruthy();
    expect(withAside.getByText("Send us a message.")).toBeTruthy();
    expect(withAside.getByRole("heading", { level: 4, name: "Address" })).toBeTruthy();
    expect(
      withAside.container
        .querySelector('[data-block="contact-form"]')
        ?.getAttribute("data-has-aside"),
    ).toBe("true");

    const withoutAside = render(
      <>{BLOCK_REGISTRY.contactForm({ heading: "Contact" }, ctxWithForm)}</>,
    );
    expect(
      withoutAside.container
        .querySelector('[data-block="contact-form"]')
        ?.hasAttribute("data-has-aside"),
    ).toBe(false);
  });

  it("liveSlot: renders nothing when ctx.liveSlots is never wired up, even with a valid slot name", () => {
    expect(BLOCK_REGISTRY.liveSlot({ slot: "staffDirectory" }, baseCtx)).toBeNull();
  });

  it("liveSlot: renders nothing when the slot name isn't present in ctx.liveSlots", () => {
    const ctxWithSlots: BlockRenderContext = {
      ...baseCtx,
      liveSlots: { staffDirectory: <div data-testid="the-real-directory" /> },
    };
    expect(BLOCK_REGISTRY.liveSlot({ slot: "somethingElse" }, ctxWithSlots)).toBeNull();
  });

  it("liveSlot: missing/non-string `slot` renders null, not a throw", () => {
    const ctxWithSlots: BlockRenderContext = {
      ...baseCtx,
      liveSlots: { staffDirectory: <div data-testid="the-real-directory" /> },
    };
    expect(BLOCK_REGISTRY.liveSlot({}, ctxWithSlots)).toBeNull();
    expect(BLOCK_REGISTRY.liveSlot({ slot: 42 }, ctxWithSlots)).toBeNull();
  });

  it("liveSlot: renders the caller's real element from ctx.liveSlots by name", () => {
    const ctxWithSlots: BlockRenderContext = {
      ...baseCtx,
      liveSlots: { staffDirectory: <div data-testid="the-real-directory" /> },
    };
    const { getByTestId } = render(
      <>{BLOCK_REGISTRY.liveSlot({ slot: "staffDirectory" }, ctxWithSlots)}</>,
    );
    expect(getByTestId("the-real-directory")).toBeTruthy();
  });

  it("featureGrid: an item's optional image manifestKey resolves through ctx.imageUrl", () => {
    const element = BLOCK_REGISTRY.featureGrid(
      { items: [{ heading: "Worship", body: "Sundays", href: "/worship", image: "worship-card" }] },
      baseCtx,
    );
    const { container } = render(<>{element}</>);
    expect((container.querySelector("img") as HTMLImageElement).src).toBe(
      testImageUrl("worship-card"),
    );
  });

  it("valuesGrid: an item's optional image manifestKey resolves through ctx.imageUrl, and is absent when unset", () => {
    const withImage = BLOCK_REGISTRY.valuesGrid(
      { items: [{ heading: "Purposeful", body: "...", image: "purposeful" }] },
      baseCtx,
    );
    const { container: c1 } = render(<>{withImage}</>);
    expect((c1.querySelector("img") as HTMLImageElement).src).toBe(testImageUrl("purposeful"));

    const withoutImage = BLOCK_REGISTRY.valuesGrid(
      { items: [{ heading: "Purposeful", body: "..." }] },
      baseCtx,
    );
    const { container: c2 } = render(<>{withoutImage}</>);
    expect(c2.querySelector("img")).toBeNull();
  });

  it("ministryList: an item's optional image manifestKey resolves through ctx.imageUrl", () => {
    const element = BLOCK_REGISTRY.ministryList(
      { items: [{ heading: "Food Pantry", body: "...", image: "pantry" }] },
      baseCtx,
    );
    const { container } = render(<>{element}</>);
    expect((container.querySelector("img") as HTMLImageElement).src).toBe(
      testImageUrl("pantry"),
    );
  });

  it("gallery: resolves plain-string manifestKeys through ctx.imageUrl with decorative alt — Gallery shows one image at a time, but two entries means dot navigation renders", () => {
    const element = BLOCK_REGISTRY.gallery({ images: ["a", "b"] }, baseCtx);
    const { container } = render(<>{element}</>);
    const image = container.querySelector("img") as HTMLImageElement;
    expect(image.src).toBe(testImageUrl("a"));
    expect(image.alt).toBe("");
    expect(container.querySelectorAll('[role="tab"]').length).toBe(2);
  });

  it("gallery: accepts {image, alt} object entries alongside plain strings, and drops an entry with no image key", () => {
    const element = BLOCK_REGISTRY.gallery(
      { images: [{ image: "a", alt: "The sanctuary" }, "b", { image: "" }] },
      baseCtx,
    );
    const { container } = render(<>{element}</>);
    const image = container.querySelector("img") as HTMLImageElement;
    expect(image.src).toBe(testImageUrl("a"));
    expect(image.alt).toBe("The sanctuary");
    // Two valid entries ("a" and "b") — the empty-image third entry was dropped.
    expect(container.querySelectorAll('[role="tab"]').length).toBe(2);
  });

  it("gallery: an empty images array renders null, not an empty shell", () => {
    expect(BLOCK_REGISTRY.gallery({ images: [] }, baseCtx)).toBeNull();
    expect(BLOCK_REGISTRY.gallery({}, baseCtx)).toBeNull();
  });
});
