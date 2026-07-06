import { describe, expect, it } from "vitest";
import { extractPricingPlans, extractPriceMentions } from "./pricing";

describe("pricing extraction", () => {
  it("extracts common SaaS plans, prices, billing periods, and limits", () => {
    const text = [
      "Free",
      "$0 / month",
      "1,000 requests included",
      "Pro",
      "$20/mo",
      "50,000 tokens included",
      "Team",
      "$50 per month",
      "10 seats",
      "Enterprise",
      "Custom pricing"
    ].join("\n");

    const plans = extractPricingPlans(text);

    expect(plans.map((plan) => plan.name)).toEqual([
      "Free",
      "Pro",
      "Team",
      "Enterprise"
    ]);
    expect(plans.find((plan) => plan.name === "Free")).toMatchObject({
      isFreeTier: true,
      priceAmount: 0,
      billingPeriod: "month"
    });
    expect(plans.find((plan) => plan.name === "Pro")).toMatchObject({
      priceAmount: 20,
      priceCurrency: "USD",
      billingPeriod: "month"
    });
    expect(plans.find((plan) => plan.name === "Team")?.limits).toContain(
      "10 seats"
    );
  });

  it("extracts Chinese plan names and yearly periods", () => {
    const plans = extractPricingPlans(
      "免费\n¥0 每月\n专业版\n¥99 每年\n团队版\n¥199 / year\n企业版\n联系我们"
    );

    expect(plans.map((plan) => plan.name)).toEqual([
      "免费",
      "专业版",
      "团队版",
      "企业版"
    ]);
    expect(plans.find((plan) => plan.name === "专业版")).toMatchObject({
      priceAmount: 99,
      priceCurrency: "CNY",
      billingPeriod: "year"
    });
  });

  it("returns standalone price mentions for diffing", () => {
    expect(extractPriceMentions("Pro costs €29/yr and Plus costs £9/mo")).toEqual([
      {
        amount: 29,
        currency: "EUR",
        period: "year",
        raw: "€29/yr"
      },
      {
        amount: 9,
        currency: "GBP",
        period: "month",
        raw: "£9/mo"
      }
    ]);
  });
});
