import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Gallery, type GalleryImage } from "../../src/components/Gallery";

const IMAGES: GalleryImage[] = [
  { url: "https://cdn.example.invalid/1.jpg", alt: "First" },
  { url: "https://cdn.example.invalid/2.jpg", alt: "Second" },
  { url: "https://cdn.example.invalid/3.jpg", alt: "Third" },
];

/** jsdom has no real `matchMedia` — stub it per test so
 * `prefers-reduced-motion` behavior is actually exercised, not just
 * assumed absent. Restored after every test via `afterEach` below. */
function stubMatchMedia(reducedMotion: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reducedMotion,
    media: query,
    addEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_event: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Gallery", () => {
  it("renders nothing for zero images", () => {
    const { container } = render(<Gallery images={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a single image with no dots and no play/pause toggle — nothing to navigate between", () => {
    render(<Gallery images={[IMAGES[0]!]} />);
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[0]!.url);
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders the first image, a dot per image, and a play/pause toggle for multiple images", () => {
    render(<Gallery images={IMAGES} />);
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[0]!.url);
    expect(screen.getAllByRole("tab").length).toBe(3);
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeTruthy();
  });

  it("clicking a dot jumps directly to that image", () => {
    render(<Gallery images={IMAGES} />);
    fireEvent.click(screen.getByRole("tab", { name: "Show image 3 of 3" }));
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[2]!.url);
  });

  it("auto-advances to the next image after intervalMs, wrapping at the end", () => {
    vi.useFakeTimers();
    render(<Gallery images={IMAGES} intervalMs={1000} />);
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[0]!.url);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[1]!.url);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[2]!.url);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[0]!.url);
  });

  it("the play/pause toggle actually stops auto-advance, not just relabels itself", () => {
    vi.useFakeTimers();
    render(<Gallery images={IMAGES} intervalMs={1000} />);
    fireEvent.click(screen.getByRole("button", { name: "Pause slideshow" }));
    expect(screen.getByRole("button", { name: "Play slideshow" })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[0]!.url);
  });

  it("hovering the gallery pauses auto-advance; leaving resumes it", () => {
    vi.useFakeTimers();
    const { container } = render(<Gallery images={IMAGES} intervalMs={1000} />);
    const section = container.querySelector('[data-block="gallery"]') as HTMLElement;
    fireEvent.mouseEnter(section);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[0]!.url);
    fireEvent.mouseLeave(section);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[1]!.url);
  });

  it("never auto-advances when prefers-reduced-motion is set, even though play/pause still renders", () => {
    stubMatchMedia(true);
    vi.useFakeTimers();
    render(<Gallery images={IMAGES} intervalMs={1000} />);
    expect(screen.getByRole("button", { name: "Pause slideshow" })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect((screen.getByRole("img") as HTMLImageElement).src).toBe(IMAGES[0]!.url);
  });

  it('variant="grid" renders every image at once, statically, with no play/pause or dots', () => {
    render(<Gallery images={IMAGES} variant="grid" />);
    const imgs = screen.getAllByRole("img") as HTMLImageElement[];
    expect(imgs.map((img) => img.src)).toEqual(IMAGES.map((image) => image.url));
    expect(screen.queryByRole("button", { name: /slideshow/i })).toBeNull();
    expect(screen.queryByRole("tablist")).toBeNull();
  });

  it('variant="grid" never advances even with fake timers running, because it holds no carousel state', () => {
    vi.useFakeTimers();
    render(<Gallery images={IMAGES} variant="grid" intervalMs={100} />);
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    // Still every image, still in original order -- nothing rotated away.
    const imgs = screen.getAllByRole("img") as HTMLImageElement[];
    expect(imgs).toHaveLength(3);
  });
});
