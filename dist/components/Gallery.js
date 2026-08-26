"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Gallery = Gallery;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
/**
 * A single-image-at-a-time auto-playing carousel — the multi-image gallery
 * block site-kit had no equivalent for before this release. The reference
 * site's own carousels (history photos, program galleries) always
 * auto-played with no way to stop them; this component keeps auto-play as
 * the default behavior but never as the *only* one, because uncontrollable
 * auto-advancing content is a real WCAG 2.2.2 failure, not a style
 * preference: a play/pause toggle, pause-on-hover, pause-on-focus, and a
 * `prefers-reduced-motion` check (auto-play never starts when the visitor's
 * OS says to avoid motion) are all load-bearing, not decoration.
 *
 * The second client component in this package, after `Nav` — a real
 * timer and real open/closed-equivalent state can't be server-rendered.
 * Every other piece of this library stays a pure server function.
 */
function Gallery({ images, intervalMs = 5000, variant = "carousel", }) {
    const [index, setIndex] = (0, react_1.useState)(0);
    const [playing, setPlaying] = (0, react_1.useState)(true);
    const [hovered, setHovered] = (0, react_1.useState)(false);
    const [focused, setFocused] = (0, react_1.useState)(false);
    const [reducedMotion, setReducedMotion] = (0, react_1.useState)(false);
    const count = images.length;
    (0, react_1.useEffect)(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(query.matches);
        const onChange = (event) => setReducedMotion(event.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);
    const advancing = playing && !hovered && !focused && !reducedMotion && count > 1;
    const timerRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        if (!advancing)
            return;
        timerRef.current = setInterval(() => {
            setIndex((current) => (current + 1) % count);
        }, intervalMs);
        return () => {
            if (timerRef.current)
                clearInterval(timerRef.current);
        };
    }, [advancing, count, intervalMs]);
    if (count === 0)
        return null;
    // After ALL hooks above (Rules of Hooks) -- the grid variant is a plain
    // static row with no carousel state of its own. A conditional return
    // ABOVE the hooks would change the hook call count between renders the
    // moment `variant` differs, which is exactly the bug this ordering
    // avoids.
    if (variant === "grid") {
        return ((0, jsx_runtime_1.jsx)("section", { "data-block": "gallery", "data-variant": "grid", children: (0, jsx_runtime_1.jsx)("ul", { children: images.map((image, gridIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                (0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("img", { src: image.url, alt: image.alt }) }, gridIndex))) }) }));
    }
    const current = images[index] ?? images[0];
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "gallery", onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), onFocus: () => setFocused(true), onBlur: () => setFocused(false), children: [(0, jsx_runtime_1.jsxs)("div", { "data-slot": "frame", children: [current ? (0, jsx_runtime_1.jsx)("img", { src: current.url, alt: current.alt }) : null, count > 1 ? ((0, jsx_runtime_1.jsx)("button", { type: "button", "data-slot": "play-toggle", "aria-label": playing ? "Pause slideshow" : "Play slideshow", "aria-pressed": playing, onClick: () => setPlaying((value) => !value), children: playing ? "Pause" : "Play" })) : null] }), count > 1 ? ((0, jsx_runtime_1.jsx)("div", { "data-slot": "dots", role: "tablist", "aria-label": "Slides", children: images.map((image, dotIndex) => ((0, jsx_runtime_1.jsx)("button", { type: "button", role: "tab", "aria-selected": dotIndex === index, "aria-label": `Show image ${dotIndex + 1} of ${count}`, "data-active": dotIndex === index ? "true" : "false", onClick: () => setIndex(dotIndex) }, dotIndex))) })) : null] }));
}
