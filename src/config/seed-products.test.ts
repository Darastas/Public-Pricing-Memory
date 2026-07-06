import { describe, expect, it } from "vitest";
import { catalogProducts } from "./pricing-catalog";
import { seedProducts } from "./seed-products";

describe("seed products", () => {
  it("includes every catalog product as a tracked product", () => {
    const seedSlugs = new Set(seedProducts.map((product) => product.slug));

    for (const product of catalogProducts) {
      expect(seedSlugs.has(product.slug), product.slug).toBe(true);
    }
  });

  it("keeps seed product slugs unique", () => {
    const slugs = seedProducts.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});
