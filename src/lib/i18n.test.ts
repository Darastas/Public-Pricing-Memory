import { describe, expect, it } from "vitest";
import { dictionary, getLocale, withLocaleHref } from "./i18n";

describe("i18n helpers", () => {
  it("defaults to English and accepts Chinese", () => {
    expect(getLocale({})).toBe("en");
    expect(getLocale({ lang: "zh" })).toBe("zh");
    expect(getLocale({ lang: "fr" })).toBe("en");
  });

  it("uses the first lang value when search params provide an array", () => {
    expect(getLocale({ lang: ["zh", "en"] })).toBe("zh");
  });

  it("adds or replaces the lang query param", () => {
    expect(withLocaleHref("/products/openai", "zh")).toBe("/products/openai?lang=zh");
    expect(withLocaleHref("/?q=openai&lang=en", "zh")).toBe("/?q=openai&lang=zh");
  });

  it("contains core bilingual labels", () => {
    expect(dictionary.en.pricingDirectory).toBe("Pricing directory");
    expect(dictionary.zh.pricingDirectory).toBe("价格目录");
  });
});
