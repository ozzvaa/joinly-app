import { describe, expect, it } from "vitest";
import { formatDate, formatTime, toDateTimeInput } from "./format";

describe("formatDate", () => {
  it("formats a date using the Slovenian locale", () => {
    expect(formatDate("2024-01-15T12:30:00.000Z")).toMatch(/^\d{1,2}\. 1\. 2024$/);
  });
});

describe("formatTime", () => {
  it("returns a two-digit hour and minute", () => {
    expect(formatTime("2024-01-15T12:30:00.000Z")).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("toDateTimeInput", () => {
  it("formats an ISO timestamp as a local datetime input value", () => {
    const date = new Date("2024-01-15T12:30:00.000Z");
    const expected = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-")
      + `T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    expect(toDateTimeInput("2024-01-15T12:30:00.000Z")).toBe(expected);
  });
});
