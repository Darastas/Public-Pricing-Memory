import type {
  CreateChangeEventInput,
  CreatePricingPlanInput,
  ExtractionStatus,
  SnapshotRecord
} from "../crawler/run-crawl";
import { generateChangeEvents, type SnapshotForDiff } from "../diff/pricing-diff";
import { extractPricingPlans, type ExtractedPricingPlan } from "./pricing";

export type SnapshotForReextract = SnapshotRecord & {
  fetchedAt: Date;
};

export type ReplaceSnapshotExtractionInput = {
  snapshotId: string;
  productId: string;
  extractionStatus: ExtractionStatus;
  errorMessage: string | null;
  pricingPlans: CreatePricingPlanInput[];
  changeEvents: CreateChangeEventInput[];
};

export type ReextractSnapshotRepository = {
  getSnapshot(snapshotId: string): Promise<SnapshotForReextract | null>;
  getPreviousSnapshot(snapshot: SnapshotForReextract): Promise<SnapshotForReextract | null>;
  replaceSnapshotExtraction(input: ReplaceSnapshotExtractionInput): Promise<void>;
};

export type ReextractSnapshotResult = {
  snapshotId: string;
  productId: string;
  status: ExtractionStatus;
  planCount: number;
  changeCount: number;
  errorMessage: string | null;
};

export async function reextractSnapshot(
  snapshotId: string,
  dependencies: {
    repository: ReextractSnapshotRepository;
    now?: () => Date;
  }
): Promise<ReextractSnapshotResult> {
  const { repository, now = () => new Date() } = dependencies;
  const snapshot = await repository.getSnapshot(snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }

  const reachable = isReachable(snapshot.httpStatus);
  const plans = reachable ? extractPricingPlans(snapshot.normalizedText) : [];
  const extractionStatus: ExtractionStatus = reachable ? "succeeded" : "failed";
  const errorMessage = reachable
    ? null
    : `Pricing page returned HTTP ${snapshot.httpStatus ?? "unknown"}`;
  const previousSnapshot = await repository.getPreviousSnapshot(snapshot);
  const changeEvents = generateChangeEvents({
    previous: previousSnapshot ? toSnapshotForDiff(previousSnapshot) : null,
    current: {
      id: snapshot.id,
      httpStatus: snapshot.httpStatus,
      contentHash: snapshot.contentHash,
      normalizedText: snapshot.normalizedText,
      plans
    }
  }).map((event) => ({
    productId: snapshot.productId,
    previousSnapshotId: previousSnapshot?.id ?? null,
    currentSnapshotId: snapshot.id,
    detectedAt: now(),
    ...event
  }));

  const pricingPlans = plans.map((plan) =>
    toCreatePricingPlanInput(snapshot.productId, snapshot.id, plan)
  );

  await repository.replaceSnapshotExtraction({
    snapshotId: snapshot.id,
    productId: snapshot.productId,
    extractionStatus,
    errorMessage,
    pricingPlans,
    changeEvents
  });

  return {
    snapshotId: snapshot.id,
    productId: snapshot.productId,
    status: extractionStatus,
    planCount: pricingPlans.length,
    changeCount: changeEvents.length,
    errorMessage
  };
}

function toCreatePricingPlanInput(
  productId: string,
  snapshotId: string,
  plan: ExtractedPricingPlan
): CreatePricingPlanInput {
  return {
    snapshotId,
    productId,
    name: plan.name,
    priceAmount: plan.priceAmount,
    priceCurrency: plan.priceCurrency,
    billingPeriod: plan.billingPeriod,
    rawPriceText: plan.rawPriceText,
    features: plan.features,
    limits: plan.limits,
    isFreeTier: plan.isFreeTier,
    metadata: plan.metadata
  };
}

function toSnapshotForDiff(snapshot: SnapshotForReextract): SnapshotForDiff {
  return {
    id: snapshot.id,
    httpStatus: snapshot.httpStatus,
    contentHash: snapshot.contentHash,
    normalizedText: snapshot.normalizedText,
    plans: snapshot.pricingPlans.map((plan) => ({
      name: plan.name,
      priceAmount: plan.priceAmount,
      priceCurrency: plan.priceCurrency as ExtractedPricingPlan["priceCurrency"],
      billingPeriod: plan.billingPeriod as ExtractedPricingPlan["billingPeriod"],
      rawPriceText: plan.rawPriceText,
      features: plan.features,
      limits: plan.limits,
      isFreeTier: plan.isFreeTier,
      metadata: {
        segment: Array.isArray(plan.metadata.segment)
          ? plan.metadata.segment.filter((value): value is string => typeof value === "string")
          : [],
        priceMentions: Array.isArray(plan.metadata.priceMentions)
          ? plan.metadata.priceMentions
          : []
      }
    }))
  };
}

function isReachable(status: number | null): boolean {
  return typeof status === "number" && status >= 200 && status < 400;
}
