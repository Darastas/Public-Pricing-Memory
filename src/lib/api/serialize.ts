import type { ExtractedPricingPlan } from "../extract/pricing";

type DecimalLike = {
  toNumber(): number;
};

export type PricingPlanLike = {
  id?: string;
  snapshotId?: string;
  productId?: string;
  name: string;
  priceAmount: DecimalLike | number | string | null;
  priceCurrency: string | null;
  billingPeriod: string | null;
  rawPriceText: string | null;
  features: unknown;
  limits: unknown;
  isFreeTier: boolean;
  metadata: unknown;
};

export function serializePricingPlan(plan: PricingPlanLike) {
  return {
    ...(plan.id ? { id: plan.id } : {}),
    ...(plan.snapshotId ? { snapshotId: plan.snapshotId } : {}),
    ...(plan.productId ? { productId: plan.productId } : {}),
    name: plan.name,
    priceAmount: decimalToNumber(plan.priceAmount),
    priceCurrency: plan.priceCurrency,
    billingPeriod: plan.billingPeriod,
    rawPriceText: plan.rawPriceText,
    features: stringArray(plan.features),
    limits: stringArray(plan.limits),
    isFreeTier: plan.isFreeTier,
    metadata: record(plan.metadata)
  };
}

export function toExtractedPricingPlan(plan: PricingPlanLike): ExtractedPricingPlan {
  const serialized = serializePricingPlan(plan);

  return {
    name: serialized.name,
    priceAmount: serialized.priceAmount,
    priceCurrency: serialized.priceCurrency as ExtractedPricingPlan["priceCurrency"],
    billingPeriod: serialized.billingPeriod as ExtractedPricingPlan["billingPeriod"],
    rawPriceText: serialized.rawPriceText,
    features: serialized.features,
    limits: serialized.limits,
    isFreeTier: serialized.isFreeTier,
    metadata: {
      segment: stringArray(serialized.metadata.segment),
      priceMentions: Array.isArray(serialized.metadata.priceMentions)
        ? serialized.metadata.priceMentions
        : []
    }
  };
}

export function decimalToNumber(value: DecimalLike | number | string | null): number | null {
  if (value === null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
