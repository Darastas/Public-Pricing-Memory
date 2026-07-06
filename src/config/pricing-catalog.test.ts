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
        "api-gpt-5-5-standard-long",
        "api-gpt-5-4-standard-short",
        "api-gpt-5-4-mini-standard-short",
        "api-gpt-5-4-nano-standard"
      ])
    );
    expect(
      bySlug.get("openai")?.prices.find((price) => price.id === "api-gpt-5-5-standard-long")
        ?.rawText
    ).toContain("$45.00");
    expect(bySlug.get("spotify")?.prices.map((price) => price.id)).toEqual(
      expect.arrayContaining(["premium-individual-us", "premium-duo-us", "premium-family-us"])
    );
  });

  it("covers the current Anthropic API model families with official rows", () => {
    const anthropic = catalogProducts.find((product) => product.slug === "anthropic");

    expect(anthropic?.prices.map((price) => price.id)).toEqual(
      expect.arrayContaining([
        "api-fable-5",
        "api-opus-4-8",
        "api-sonnet-5",
        "api-haiku-4-5"
      ])
    );
    expect(anthropic?.prices.some((price) => price.rawText.includes("Sonnet 5 input"))).toBe(
      false
    );
  });

  it("publishes official prices for AI providers that have public official pricing", () => {
    const bySlug = new Map(catalogProducts.map((product) => [product.slug, product]));
    const reviewedSlugs = [
      "zhipu-glm",
      "deepseek",
      "kimi",
      "google-gemini",
      "xai",
      "together-ai",
      "groq",
      "perplexity",
      "alibaba-tongyi",
      "tencent-hunyuan",
      "minimax",
      "stepfun",
      "siliconflow"
    ];

    for (const slug of reviewedSlugs) {
      expect(bySlug.get(slug)?.prices.some((price) => price.status === "published")).toBe(true);
      expect(bySlug.get(slug)?.prices.some((price) => price.confidence === "official")).toBe(true);
    }
  });

  it("keeps official model price rows for corrected provider catalogs", () => {
    const bySlug = new Map(catalogProducts.map((product) => [product.slug, product]));

    expect(bySlug.get("deepseek")?.prices.map((price) => price.id)).toEqual(
      expect.arrayContaining([
        "api-deepseek-v4-flash-cache-miss",
        "api-deepseek-v4-pro-cache-miss"
      ])
    );
    expect(bySlug.get("groq")?.prices.find((price) => price.id === "api-gpt-oss-120b")?.rawText)
      .toContain("$0.60");
    expect(bySlug.get("siliconflow")?.pricingUrl).toBe("https://siliconflow.cn/pricing");
    expect(bySlug.get("siliconflow")?.prices.map((price) => price.id)).toEqual(
      expect.arrayContaining(["api-glm-5-2", "api-deepseek-v4-pro"])
    );
  });

  it("does not leave generic needs-review placeholders after official review", () => {
    for (const price of catalogProducts.flatMap((product) => product.prices)) {
      if (price.status === "needs_review") {
        expect(price.rawText).not.toContain("exact public price needs account");
        expect(price.rawText.length).toBeGreaterThan(20);
      }
    }
  });
});
