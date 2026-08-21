// Synthetic fixtures only — no real congregation name, person, address, or
// credential anywhere in this file or any other test in this repo. See
// README.md's "No Real Data" section.

import type { RenderSiteBundleProfile } from "../src/types";

export const testImageUrl = (manifestKey: string): string =>
  `https://cdn.example.invalid/${manifestKey}.jpg`;

export const emptyProfile: RenderSiteBundleProfile = {
  address: null,
  phone: null,
  socialLinks: [],
  serviceTimes: [],
  officeHours: [],
};

export const fullProfile: RenderSiteBundleProfile = {
  address: "100 Placeholder Way, Fillmore, ZZ 00000",
  phone: "555-0100",
  socialLinks: [
    { platform: "facebook", url: "https://facebook.example.invalid/fillmore" },
    { platform: "instagram", url: "https://instagram.example.invalid/fillmore" },
  ],
  serviceTimes: [
    { dayOfWeek: 0, startTime: "10:15", endTime: "11:30", label: "Traditional" },
    { dayOfWeek: 0, startTime: "9:00", endTime: "9:45", label: null },
  ],
  officeHours: [
    { dayOfWeek: 1, startTime: "9:00", endTime: "17:00", label: null },
  ],
};
