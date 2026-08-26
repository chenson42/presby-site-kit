"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Hero = Hero;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function Hero({ eyebrow, heading, tagline, body, imageUrl, imageAlt, slides, cta, headingClassName, variant = "subpage", }) {
    const images = slides && slides.length > 0
        ? slides
        : imageUrl
            ? [{ imageUrl, imageAlt: imageAlt ?? "" }]
            : [];
    const [index, setIndex] = (0, react_1.useState)(0);
    const [reducedMotion, setReducedMotion] = (0, react_1.useState)(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const timerRef = (0, react_1.useRef)(null);
    const advancing = variant === "carousel" && images.length > 1 && !reducedMotion;
    (0, react_1.useEffect)(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = (event) => setReducedMotion(event.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);
    (0, react_1.useEffect)(() => {
        if (!advancing)
            return;
        timerRef.current = setInterval(() => {
            setIndex((current) => (current + 1) % images.length);
        }, 6000);
        return () => {
            if (timerRef.current)
                clearInterval(timerRef.current);
        };
    }, [advancing, images.length]);
    const current = images[index] ?? images[0];
    const currentEyebrow = current?.eyebrow ?? eyebrow;
    const currentHeading = current?.heading ?? heading;
    return ((0, jsx_runtime_1.jsxs)("section", { "data-block": "hero", "data-variant": variant, children: [(0, jsx_runtime_1.jsxs)("div", { "data-slot": "frame", children: [current ? (0, jsx_runtime_1.jsx)("img", { src: current.imageUrl, alt: current.imageAlt }) : null, (0, jsx_runtime_1.jsx)("div", { "data-slot": "scrim", "aria-hidden": "true" }), (0, jsx_runtime_1.jsxs)("div", { "data-slot": "content", children: [currentEyebrow ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "eyebrow", children: currentEyebrow }) : null, (0, jsx_runtime_1.jsx)("h1", { className: headingClassName, children: currentHeading }), body ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "body", children: body }) : null, cta ? (0, jsx_runtime_1.jsx)("a", { href: cta.href, children: cta.label }) : null] }), images.length > 1 ? ((0, jsx_runtime_1.jsx)("div", { "data-slot": "dots", role: "tablist", "aria-label": "Slides", children: images.map((slide, dotIndex) => ((0, jsx_runtime_1.jsx)("button", { type: "button", role: "tab", "aria-selected": dotIndex === index, "aria-label": `Show slide ${dotIndex + 1} of ${images.length}`, "data-active": dotIndex === index ? "true" : "false", onClick: () => setIndex(dotIndex) }, dotIndex))) })) : null] }), tagline ? (0, jsx_runtime_1.jsx)("p", { "data-slot": "tagline", children: tagline }) : null] }));
}
