import { describe, expect, it } from "vitest";
import type { CatalogProduct } from "@/config/pricing-catalog";
import {
  filterCatalogProducts,
  getRepresentativePrice,
  getRegionLabel
} from "./filters";

const products: CatalogProduct[] = [
  {
    slug: "openai",
    name: "OpenAI",
    displayName: { en: "OpenAI", zh: "OpenAI" },
    category: "ai_api",
    websiteUrl: "https://openai.com",
    pricingUrl: "https://developers.openai.com/api/docs/pricing",
    regions: ["global"],
    prices: [
      {
        id: "api",
        kind: "ai_api",
        label: { en: "API", zh: "API" },
        region: "global",
        status: "published",
        amount: 1,
        currency: "USD",
        billingPeriod: null,
        unit: "1M tokens",
        rawText: "$1 / 1M tokens",
        sourceUrl: "https://developers.openai.com/api/docs/pricing",
        sourceLabel: "OpenAI API pricing",
        lastCheckedAt: "2026-07-06",
        confidence: "official"
      }
    ]
  },
  {
    slug: "spotify",
    name: "Spotify",
    displayName: { en: "Spotify", zh: "Spotify" },
    category: "consumer_subscription",
    websiteUrl: "https://www.spotify.com",
    pricingUrl: "https://www.spotify.com/us/premium/",
    regions: ["US"],
    prices: [
      {
        id: "individual-us",
        kind: "consumer_subscription",
        label: { en: "Individual", zh: "个人" },
        region: "US",
        status: "published",
        amount: 12.99,
        currency: "USD",
        billingPeriod: "month",
        unit: null,
        rawText: "$12.99 / month",
        sourceUrl: "https://www.spotify.com/us/premium/",
        sourceLabel: "Spotify Premium US",
        lastCheckedAt: "2026-07-06",
        confidence: "official"
      }
    ]
  }
];

describe("catalog filters", () => {
  it("filters by kind, region, and text query", () => {
    expect(
      filterCatalogProducts(products, {
        kind: "consumer_subscription",
        region: "US",
        query: "spot"
      }).map((product) => product.slug)
    ).toEqual(["spotify"]);
  });

  it("matches global prices for any region filter", () => {
    expect(
      filterCatalogProducts(products, {
        kind: "all",
        region: "CN",
        query: "open"
      }).map((product) => product.slug)
    ).toEqual(["openai"]);
  });

  it("selects a published representative price before review rows", () => {
    expect(getRepresentativePrice(products[0])?.rawText).toBe("$1 / 1M tokens");
  });

  it("localizes region labels", () => {
    expect(getRegionLabel("US", "en")).toBe("United States");
    expect(getRegionLabel("US", "zh")).toBe("美国");
  });
});
