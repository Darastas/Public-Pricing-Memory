import type { ExtractedPricingPlan } from "../extract/pricing";
import { extractPricingPlans } from "../extract/pricing";
import { generateChangeEvents, type SnapshotForDiff } from "../diff/pricing-diff";
import { createContentHash, htmlToNormalizedText } from "../normalize";

export type ExtractionStatus = "pending" | "succeeded" | "failed" | "unchanged";
export type CrawlJobStatus = "queued" | "running" | "succeeded" | "failed";

export type CrawlProduct = {
  id: string;
  pricingUrl: string;
};

export type StoredPricingPlan = {
  name: string;
  priceAmount: number | null;
  priceCurrency: string | null;
  billingPeriod: string | null;
  rawPriceText: string | null;
  features: string[];
  limits: string[];
  isFreeTier: boolean;
  metadata: Record<string, unknown>;
};

export type SnapshotRecord = {
  id: string;
  productId: string;
  httpStatus: number | null;
  contentHash: string;
  normalizedText: string;
  pricingPlans: StoredPricingPlan[];
};

export type CreateSnapshotInput = {
  productId: string;
  fetchedAt: Date;
  sourceUrl: string;
  httpStatus: number | null;
  contentHash: string;
  rawHtmlStorageKey: string | null;
  rawHtml: string | null;
  normalizedText: string;
  screenshotStorageKey: string | null;
  extractionStatus: ExtractionStatus;
  errorMessage: string | null;
};

export type CreatePricingPlanInput = StoredPricingPlan & {
  snapshotId: string;
  productId: string;
};

export type CreateChangeEventInput = {
  productId: string;
  previousSnapshotId: string | null;
  currentSnapshotId: string;
  detectedAt: Date;
  changeType:
    | "price_increase"
    | "price_decrease"
    | "plan_added"
    | "plan_removed"
    | "plan_renamed"
    | "free_tier_changed"
    | "feature_gate_changed"
    | "usage_limit_changed"
    | "copy_changed"
    | "page_unreachable"
    | "structure_changed";
  severity: "low" | "medium" | "high";
  title: string;
  summary: string;
  details: Record<string, unknown>;
};

export type CrawlLogEntry = {
  at: string;
  level: "info" | "error";
  message: string;
  details?: Record<string, unknown>;
};

export type CrawlRepository = {
  getProduct(productId: string): Promise<CrawlProduct | null>;
  getLatestSnapshot(productId: string): Promise<SnapshotRecord | null>;
  createCrawlJob(productId: string): Promise<{ id: string }>;
  updateCrawlJob(
    jobId: string,
    input: {
      status: CrawlJobStatus;
      startedAt?: Date;
      finishedAt?: Date;
      errorMessage?: string | null;
      logs: CrawlLogEntry[];
    }
  ): Promise<void>;
  createSnapshot(input: CreateSnapshotInput): Promise<SnapshotRecord>;
  createPricingPlans(plans: CreatePricingPlanInput[]): Promise<void>;
  createChangeEvents(events: CreateChangeEventInput[]): Promise<void>;
};

export type FetchPageResult = {
  finalUrl: string;
  html: string;
  httpStatus: number | null;
  errorMessage?: string;
};

export type RunCrawlResult = {
  status: "succeeded" | "unchanged" | "failed";
  jobId: string;
  snapshotId: string;
  contentHash: string;
  planCount: number;
  changeCount: number;
  errorMessage: string | null;
};

export async function runCrawl(
  productId: string,
  dependencies: {
    repository: CrawlRepository;
    fetchPage: (url: string) => Promise<FetchPageResult>;
    now?: () => Date;
  }
): Promise<RunCrawlResult> {
  const { repository, fetchPage, now = () => new Date() } = dependencies;
  const startedAt = now();
  const logs: CrawlLogEntry[] = [];
  const product = await repository.getProduct(productId);
  if (!product) {
    throw new Error(`Product ${productId} not found`);
  }

  const job = await repository.createCrawlJob(product.id);

  const log = (
    level: CrawlLogEntry["level"],
    message: string,
    details?: Record<string, unknown>
  ) => {
    logs.push({ at: now().toISOString(), level, message, details });
  };

  await repository.updateCrawlJob(job.id, {
    status: "running",
    startedAt,
    logs
  });

  try {
    log("info", "Starting pricing page fetch", { url: product.pricingUrl });
    const previousSnapshot = await repository.getLatestSnapshot(product.id);
    const fetched = await fetchWithErrorCapture(fetchPage, product.pricingUrl);
    const reachable = isReachable(fetched.httpStatus);
    const normalizedText = fetched.html ? htmlToNormalizedText(fetched.html) : "";
    const contentHash = createSnapshotHash(normalizedText, fetched.httpStatus);
    const extractedPlans = reachable ? extractPricingPlans(normalizedText) : [];
    const unchanged = previousSnapshot?.contentHash === contentHash;
    const errorMessage =
      fetched.errorMessage ??
      (reachable ? null : `Pricing page returned HTTP ${fetched.httpStatus ?? "unknown"}`);
    const extractionStatus: ExtractionStatus = reachable
      ? unchanged
        ? "unchanged"
        : "succeeded"
      : "failed";

    const snapshot = await repository.createSnapshot({
      productId: product.id,
      fetchedAt: now(),
      sourceUrl: fetched.finalUrl,
      httpStatus: fetched.httpStatus,
      contentHash,
      rawHtmlStorageKey: null,
      rawHtml: unchanged ? null : fetched.html || null,
      normalizedText,
      screenshotStorageKey: null,
      extractionStatus,
      errorMessage
    });

    const pricingPlans = extractedPlans.map((plan) =>
      toCreatePricingPlanInput(product.id, snapshot.id, plan)
    );
    await repository.createPricingPlans(pricingPlans);

    const currentForDiff: SnapshotForDiff = {
      id: snapshot.id,
      httpStatus: fetched.httpStatus,
      contentHash,
      normalizedText,
      plans: extractedPlans
    };
    const previousForDiff = previousSnapshot
      ? toSnapshotForDiff(previousSnapshot)
      : null;
    const generatedEvents = generateChangeEvents({
      previous: previousForDiff,
      current: currentForDiff
    });
    const changeEvents = generatedEvents.map((event) => ({
      productId: product.id,
      previousSnapshotId: previousSnapshot?.id ?? null,
      currentSnapshotId: snapshot.id,
      detectedAt: now(),
      ...event
    }));
    await repository.createChangeEvents(changeEvents);

    const status: RunCrawlResult["status"] = reachable
      ? unchanged
        ? "unchanged"
        : "succeeded"
      : "failed";
    log(status === "failed" ? "error" : "info", "Crawl finished", {
      status,
      planCount: pricingPlans.length,
      changeCount: changeEvents.length
    });
    await repository.updateCrawlJob(job.id, {
      status: status === "failed" ? "failed" : "succeeded",
      finishedAt: now(),
      errorMessage,
      logs
    });

    return {
      status,
      jobId: job.id,
      snapshotId: snapshot.id,
      contentHash,
      planCount: pricingPlans.length,
      changeCount: changeEvents.length,
      errorMessage
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown crawl failure";
    log("error", message);
    await repository.updateCrawlJob(job.id, {
      status: "failed",
      finishedAt: now(),
      errorMessage: message,
      logs
    });
    throw error;
  }
}

async function fetchWithErrorCapture(
  fetchPage: (url: string) => Promise<FetchPageResult>,
  url: string
): Promise<FetchPageResult> {
  try {
    return await fetchPage(url);
  } catch (error) {
    return {
      finalUrl: url,
      html: "",
      httpStatus: null,
      errorMessage: error instanceof Error ? error.message : "Unknown fetch failure"
    };
  }
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

function toSnapshotForDiff(snapshot: SnapshotRecord): SnapshotForDiff {
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

function createSnapshotHash(normalizedText: string, httpStatus: number | null): string {
  if (isReachable(httpStatus)) {
    return createContentHash(normalizedText);
  }

  return createContentHash(`http-status:${httpStatus ?? "unknown"}\n${normalizedText}`);
}

function isReachable(status: number | null): boolean {
  return typeof status === "number" && status >= 200 && status < 400;
}
