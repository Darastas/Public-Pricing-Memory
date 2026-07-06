import type {
  CrawlRepository,
  CreateChangeEventInput,
  CreatePricingPlanInput,
  CreateSnapshotInput,
  SnapshotRecord,
  StoredPricingPlan
} from "./run-crawl";

type PrismaLike = {
  product?: {
    findUnique(args: unknown): Promise<unknown>;
  };
  snapshot?: {
    findFirst?(args: unknown): Promise<unknown>;
    create?(args: unknown): Promise<unknown>;
  };
  pricingPlan?: {
    createMany(args: unknown): Promise<unknown>;
  };
  changeEvent?: {
    createMany(args: unknown): Promise<unknown>;
  };
  crawlJob?: {
    create(args: unknown): Promise<{ id: string }>;
    update(args: unknown): Promise<unknown>;
  };
};

type PrismaSnapshotWithPlans = {
  id: string;
  productId: string;
  httpStatus: number | null;
  contentHash: string;
  normalizedText: string;
  pricingPlans: PrismaPricingPlan[];
};

type PrismaPricingPlan = {
  name: string;
  priceAmount: { toNumber(): number } | number | string | null;
  priceCurrency: string | null;
  billingPeriod: string | null;
  rawPriceText: string | null;
  features: unknown;
  limits: unknown;
  isFreeTier: boolean;
  metadata: unknown;
};

export function createPrismaCrawlRepository(
  prisma: PrismaLike
): CrawlRepository {
  return {
    async getProduct(productId) {
      assertModel(prisma.product, "product");
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, pricingUrl: true }
      });
      return isProductRecord(product) ? product : null;
    },

    async getLatestSnapshot(productId) {
      assertModel(prisma.snapshot, "snapshot");
      assertModelMethod(prisma.snapshot.findFirst, "snapshot.findFirst");
      const snapshot = await prisma.snapshot.findFirst({
        where: { productId },
        orderBy: { fetchedAt: "desc" },
        include: { pricingPlans: { orderBy: { name: "asc" } } }
      });

      return isSnapshotWithPlans(snapshot) ? toSnapshotRecord(snapshot) : null;
    },

    async createCrawlJob(productId) {
      assertModel(prisma.crawlJob, "crawlJob");
      return prisma.crawlJob.create({
        data: {
          productId,
          status: "queued",
          logs: []
        },
        select: { id: true }
      });
    },

    async updateCrawlJob(jobId, input) {
      assertModel(prisma.crawlJob, "crawlJob");
      await prisma.crawlJob.update({
        where: { id: jobId },
        data: omitUndefined(input)
      });
    },

    async createSnapshot(input) {
      assertModel(prisma.snapshot, "snapshot");
      assertModelMethod(prisma.snapshot.create, "snapshot.create");
      const snapshot = await prisma.snapshot.create({
        data: toSnapshotData(input),
        include: { pricingPlans: true }
      });

      if (!isSnapshotWithPlans(snapshot)) {
        throw new Error("Prisma did not return the created snapshot");
      }

      return toSnapshotRecord(snapshot);
    },

    async createPricingPlans(plans) {
      if (plans.length === 0) return;
      assertModel(prisma.pricingPlan, "pricingPlan");
      await prisma.pricingPlan.createMany({
        data: plans.map(toPricingPlanData)
      });
    },

    async createChangeEvents(events) {
      if (events.length === 0) return;
      assertModel(prisma.changeEvent, "changeEvent");
      await prisma.changeEvent.createMany({
        data: events.map(toChangeEventData)
      });
    }
  };
}

function toSnapshotData(input: CreateSnapshotInput) {
  return {
    productId: input.productId,
    fetchedAt: input.fetchedAt,
    sourceUrl: input.sourceUrl,
    httpStatus: input.httpStatus,
    contentHash: input.contentHash,
    rawHtmlStorageKey: input.rawHtmlStorageKey,
    rawHtml: input.rawHtml,
    normalizedText: input.normalizedText,
    screenshotStorageKey: input.screenshotStorageKey,
    extractionStatus: input.extractionStatus,
    errorMessage: input.errorMessage
  };
}

function toPricingPlanData(input: CreatePricingPlanInput) {
  return {
    snapshotId: input.snapshotId,
    productId: input.productId,
    name: input.name,
    priceAmount: input.priceAmount,
    priceCurrency: input.priceCurrency,
    billingPeriod: input.billingPeriod,
    rawPriceText: input.rawPriceText,
    features: input.features,
    limits: input.limits,
    isFreeTier: input.isFreeTier,
    metadata: input.metadata
  };
}

function toChangeEventData(input: CreateChangeEventInput) {
  return {
    productId: input.productId,
    previousSnapshotId: input.previousSnapshotId,
    currentSnapshotId: input.currentSnapshotId,
    detectedAt: input.detectedAt,
    changeType: input.changeType,
    severity: input.severity,
    title: input.title,
    summary: input.summary,
    details: input.details
  };
}

function toSnapshotRecord(snapshot: PrismaSnapshotWithPlans): SnapshotRecord {
  return {
    id: snapshot.id,
    productId: snapshot.productId,
    httpStatus: snapshot.httpStatus,
    contentHash: snapshot.contentHash,
    normalizedText: snapshot.normalizedText,
    pricingPlans: snapshot.pricingPlans.map(toStoredPricingPlan)
  };
}

function toStoredPricingPlan(plan: PrismaPricingPlan): StoredPricingPlan {
  return {
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

function decimalToNumber(
  value: PrismaPricingPlan["priceAmount"]
): number | null {
  if (value === null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function omitUndefined<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  ) as T;
}

function assertModel<T>(model: T | undefined, name: string): asserts model is T {
  if (!model) {
    throw new Error(`Prisma model ${name} is not available`);
  }
}

function assertModelMethod<T extends (...args: never[]) => unknown>(
  method: T | undefined,
  name: string
): asserts method is T {
  if (!method) {
    throw new Error(`Prisma method ${name} is not available`);
  }
}

function isProductRecord(value: unknown): value is { id: string; pricingUrl: string } {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "pricingUrl" in value &&
    typeof value.pricingUrl === "string"
  );
}

function isSnapshotWithPlans(value: unknown): value is PrismaSnapshotWithPlans {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "productId" in value &&
    typeof value.productId === "string" &&
    "contentHash" in value &&
    typeof value.contentHash === "string" &&
    "normalizedText" in value &&
    typeof value.normalizedText === "string" &&
    "pricingPlans" in value &&
    Array.isArray(value.pricingPlans)
  );
}
