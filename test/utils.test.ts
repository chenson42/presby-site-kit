import { describe, expect, it } from "vitest";
import { formatClockTime } from "../src/utils";

describe("formatClockTime", () => {
  it("formats a plain HH:MM string", () => {
    expect(formatClockTime("10:15")).toBe("10:15 AM");
    expect(formatClockTime("18:30")).toBe("6:30 PM");
  });

  it("REGRESSION: formats HH:MM:SS, the real shape Postgres's `time` column serializes as", () => {
    // Found live during this package's own end-to-end verification against
    // presby's real presby_published_site(): organization_service_times'
    // start_time/end_time columns come back as "10:15:00", not "10:15" —
    // the original regex only matched HH:MM and silently returned the raw
    // "10:15:00" string instead of formatting it. Not a hypothetical input.
    expect(formatClockTime("10:15:00")).toBe("10:15 AM");
    expect(formatClockTime("18:30:00")).toBe("6:30 PM");
    expect(formatClockTime("00:00:00")).toBe("12:00 AM");
    expect(formatClockTime("23:59:59")).toBe("11:59 PM");
  });

  it("midnight and noon boundaries", () => {
    expect(formatClockTime("00:00")).toBe("12:00 AM");
    expect(formatClockTime("12:00")).toBe("12:00 PM");
  });

  it("returns a malformed value as-is rather than throwing", () => {
    expect(formatClockTime("not a time")).toBe("not a time");
    expect(formatClockTime("25:99")).toBe("25:99");
    expect(formatClockTime("")).toBe("");
  });
});
