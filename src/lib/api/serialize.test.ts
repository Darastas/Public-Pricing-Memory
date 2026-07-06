import { describe, expect, it } from "vitest";
import { serializePricingPlan, toExtractedPricingPlan } from "./serialize";

describe("API serializers", () => {
  it("serializes Prisma-like pricing plans into stable JSON and extracted-plan shape", () => {
    const plan = {
      id: "plan-1",
      snapshotId: "snapshot-1",
      productId: "product-1",
      name: "Pro",
      priceAmount: { toNumber: () => 20 },
      priceCurrency: "USD",
      billingPeriod: "month",
      rawPriceText: "$20/mo",
      features: ["SSO support", 42],
      limits: ["10 seats included", null],
      isFreeTier: false,
      metadata: { segment: ["Pro", "$20/mo"], priceMentions: [] }
    };

    expect(serializePricingPlan(plan)).toEqual({
      id: "plan-1",
      snapshotId: "snapshot-1",
      productId: "product-1",
      name: "Pro",
      priceAmount: 20,
      priceCurrency: "USD",
      billingPeriod: "month",
      rawPriceText: "$20/mo",
      features: ["SSO support"],
      limits: ["10 seats included"],
      isFreeTier: false,
      metadata: { segment: ["Pro", "$20/mo"], priceMentions: [] }
    });
    expect(toExtractedPricingPlan(plan)).toEqual({
      name: "Pro",
      priceAmount: 20,
      priceCurrency: "USD",
      billingPeriod: "month",
      rawPriceText: "$20/mo",
      features: ["SSO support"],
      limits: ["10 seats included"],
      isFreeTier: false,
      metadata: { segment: ["Pro", "$20/mo"], priceMentions: [] }
    });
  });
});
