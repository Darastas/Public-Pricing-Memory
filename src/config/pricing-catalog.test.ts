import { describe, expect, it } from "vitest";
import { catalogProducts, catalogRegions, catalogKinds } from "./pricing-catalog";

describe("pricing catalog data", () => {
  it("defines the first-pass regions and catalog kinds", () => {
    expect(catalogRegions).toEqual(["global", "US", "CN", "EU", "UK", "JP", "IN"]);
    expect(catalogKinds).toEqual([
      "ai_api",
      "ai_subscription",
      "consumer_subscription",
      "developer_subscription"
    ]);
  });

  it("uses unique product slugs and price ids", () => {
    const slugs = catalogProducts.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    const priceIds = catalogProducts.flatMap((product) =>
      product.prices.map((price) => `${product.slug}:${price.id}`)
    );
    expect(new Set(priceIds).size).toBe(priceIds.length);
  });

  it("includes source metadata for every product and price row", () => {
    for (const product of catalogProducts) {
      expect(product.pricingUrl).toMatch(/^https:\/\//);
      expect(() => new URL(product.pricingUrl)).not.toThrow();
      expect(product.prices.length).toBeGreaterThan(0);

      for (const price of product.prices) {
        expect(() => new URL(price.sourceUrl)).not.toThrow();
        expect(price.sourceUrl).toMatch(/^https:\/\//);
        expect(price.sourceLabel.length).toBeGreaterThan(2);
        expect(price.lastCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(["official", "needs_review"]).toContain(price.confidence);
      }
    }
  });

  it("does not represent unpublished prices as fake zero values", () => {
    for (const price of catalogProducts.flatMap((product) => product.prices)) {
      if (price.status === "not_published") {
        expect(price.amount).toBeNull();
        expect(price.currency).toBeNull();
      }

      if (price.status === "published") {
        expect(price.amount !== null || price.rawText.trim().length > 0).toBe(true);
      }
    }
  });

  it("covers the approved first-pass product set", () => {
    expect(catalogProducts.map((product) => product.slug)).toEqual(
      expect.arrayContaining([
        "openai",
        "anthropic",
        "deepseek",
        "zhipu-glm",
        "kimi",
        "google-gemini",
        "xai",
        "mistral",
        "cohere",
        "together-ai",
        "groq",
        "perplexity",
        "baidu-qianfan",
        "alibaba-tongyi",
        "tencent-hunyuan",
        "iflytek-spark",
        "minimax",
        "01-ai",
        "stepfun",
        "siliconflow",
        "spotify",
        "youtube-premium",
        "netflix",
        "disney-plus",
        "apple-one",
        "amazon-prime",
        "notion",
        "github",
        "cursor",
        "chatgpt",
        "claude"
      ])
    );
  });

  it("records multiple official rows for products with several published plans", () => {
    const bySlug = new Map(catalogProducts.map((product) => [product.slug, product]));

    expect(bySlug.get("openai")?.prices.map((price) => price.id)).toEqual(
      expect.arrayContaining([
        "api-gpt-5-5-standard-short",
        "api-gpt-5-4-mini-standard-short"
      ])
    );
    expect(bySlug.get("spotify")?.prices.map((price) => price.id)).toEqual(
      expect.arrayContaining(["premium-individual-us", "premium-duo-us", "premium-family-us"])
    );
  });
});
