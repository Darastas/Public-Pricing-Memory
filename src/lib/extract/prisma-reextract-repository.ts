import type {
  CreateChangeEventInput,
  CreatePricingPlanInput,
  StoredPricingPlan
} from "../crawler/run-crawl";
import type {
  ReextractSnapshotRepository,
  ReplaceSnapshotExtractionInput,
  SnapshotForReextract
} from "./reextract-snapshot";

type PrismaLike = {
  $transaction?<T>(callback: (tx: PrismaLike) => Promise<T>): Promise<T>;
  snapshot?: {
    findUnique(args: unknown): Promise<unknown>;
    findFirst(args: unknown): Promise<unknown>;
    update(args: unknown): Promise<unknown>;
  };
  pricingPlan?: {
    deleteMany(args: unknown): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
  changeEvent?: {
    deleteMany(args: unknown): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
};

type PrismaSnapshotWithPlans = {
  id: string;
  productId: string;
  fetchedAt: Date;
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

export function createPrismaReextractRepository(
  prisma: PrismaLike
): ReextractSnapshotRepository {
  return {
    async getSnapshot(snapshotId) {
      assertModel(prisma.snapshot, "snapshot");
      const snapshot = await prisma.snapshot.findUnique({
        where: { id: snapshotId },
        include: { pricingPlans: { orderBy: { name: "asc" } } }
      });

      return isSnapshotWithPlans(snapshot) ? toSnapshotForReextract(snapshot) : null;
    },

    async getPreviousSnapshot(snapshot) {
      assertModel(prisma.snapshot, "snapshot");
      const previousSnapshot = await prisma.snapshot.findFirst({
        where: {
          productId: snapshot.productId,
          fetchedAt: { lt: snapshot.fetchedAt }
        },
        orderBy: { fetchedAt: "desc" },
        include: { pricingPlans: { orderBy: { name: "asc" } } }
      });

      return isSnapshotWithPlans(previousSnapshot)
        ? toSnapshotForReextract(previousSnapshot)
        : null;
    },

    async replaceSnapshotExtraction(input) {
      if (prisma.$transaction) {
        await prisma.$transaction(async (tx) => replaceSnapshotExtraction(tx, input));
        return;
      }

      await replaceSnapshotExtraction(prisma, input);
    }
  };
}

async function replaceSnapshotExtraction(
  prisma: PrismaLike,
  input: ReplaceSnapshotExtractionInput
) {
  assertModel(prisma.pricingPlan, "pricingPlan");
  assertModel(prisma.changeEvent, "changeEvent");
  assertModel(prisma.snapshot, "snapshot");

  await prisma.pricingPlan.deleteMany({
    where: { snapshotId: input.snapshotId }
  });
  await prisma.changeEvent.deleteMany({
    where: { currentSnapshotId: input.snapshotId }
  });
  await prisma.snapshot.update({
    where: { id: input.snapshotId },
    data: {
      extractionStatus: input.extractionStatus,
      errorMessage: input.errorMessage
    }
  });

  if (input.pricingPlans.length > 0) {
    await prisma.pricingPlan.createMany({
      data: input.pricingPlans.map(toPricingPlanData)
    });
  }

  if (input.changeEvents.length > 0) {
    await prisma.changeEvent.createMany({
      data: input.changeEvents.map(toChangeEventData)
    });
  }
}

function toSnapshotForReextract(
  snapshot: PrismaSnapshotWithPlans
): SnapshotForReextract {
  return {
    id: snapshot.id,
    productId: snapshot.productId,
    fetchedAt: snapshot.fetchedAt,
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

function decimalToNumber(value: PrismaPricingPlan["priceAmount"]): number | null {
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

function assertModel<T>(model: T | undefined, name: string): asserts model is T {
  if (!model) {
    throw new Error(`Prisma model ${name} is not available`);
  }
}

function isSnapshotWithPlans(value: unknown): value is PrismaSnapshotWithPlans {
  return (
    value !== null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "productId" in value &&
    typeof value.productId === "string" &&
    "fetchedAt" in value &&
    value.fetchedAt instanceof Date &&
    "contentHash" in value &&
    typeof value.contentHash === "string" &&
    "normalizedText" in value &&
    typeof value.normalizedText === "string" &&
    "pricingPlans" in value &&
    Array.isArray(value.pricingPlans)
  );
}
