import { describe, expect, it } from "vitest";
import { buildSlug, normalizeHttpUrl } from "./url";

describe("URL helpers", () => {
  it("normalizes bare domains into https URLs", () => {
    expect(normalizeHttpUrl("example.com/pricing")).toBe(
      "https://example.com/pricing"
    );
  });

  it("rejects non-http protocols and malformed values", () => {
    expect(() => normalizeHttpUrl("javascript:alert(1)")).toThrow(
      "Only http and https URLs are supported"
    );
    expect(() => normalizeHttpUrl("not a url")).toThrow("Invalid URL");
  });

  it("builds stable lowercase product slugs", () => {
    expect(buildSlug("OpenAI API Pricing")).toBe("openai-api-pricing");
    expect(buildSlug("企业版 Pricing 2026")).toBe("pricing-2026");
  });
});
