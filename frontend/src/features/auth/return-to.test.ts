import { describe, expect, it } from "vitest";

import { getSafeReturnTo } from "./return-to";

describe("getSafeReturnTo", () => {
  it.each([
    ["/favorites", "/favorites"],
    ["/properties/flat-1?from=home#details", "/properties/flat-1?from=home#details"],
  ])("keeps an internal route %s", (value, expected) => {
    expect(getSafeReturnTo(value)).toBe(expected);
  });

  it.each([
    "https://evil.example/path",
    "//evil.example/path",
    "/\\evil.example/path",
    "javascript:alert(1)",
    "not-a-path",
  ])("rejects an unsafe route %s", (value) => {
    expect(getSafeReturnTo(value)).toBeNull();
  });
});