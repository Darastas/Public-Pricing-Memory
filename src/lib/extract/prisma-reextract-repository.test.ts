import { describe, expect, it, vi } from "vitest";
import type { ReplaceSnapshotExtractionInput } from "./reextract-snapshot";
import { createPrismaReextractRepository } from "./prisma-reextract-repository";

describe("Prisma reextract repository", () => {
  it("loads snapshots with pricing plans and converts decimal values", async () => {
    const prisma = {
      snapshot: {
        findUnique: vi.fn(async () => ({
          id: "snapshot-1",
          productId: "product-1",
          fetchedAt: new Date("2026-01-02T00:00:00.000Z"),
          httpStatus: 200,
          contentHash: "hash",
          normalizedText: "Pro\n$25/mo",
          pricingPlans: [
            {
              name: "Pro",
              priceAmount: { toNumber: () => 25 },
              priceCurrency: "USD",
              billingPeriod: "month",
              rawPriceText: "$25/mo",
              features: ["Priority support"],
              limits: ["10 seats"],
              isFreeTier: false,
              metadata: { segment: ["$25/mo"], priceMentions: [] }
            }
          ]
        })),
        findFirst: vi.fn(async () => null),
        update: vi.fn()
      }
    };

    const repository = createPrismaReextractRepository(prisma);

    await expect(repository.getSnapshot("snapshot-1")).resolves.toMatchObject({
      id: "snapshot-1",
      productId: "product-1",
      pricingPlans: [
        expect.objectContaining({
          name: "Pro",
          priceAmount: 25,
          limits: ["10 seats"]
        })
      ]
    });
    expect(prisma.snapshot.findUnique).toHaveBeenCalledWith({
      where: { id: "snapshot-1" },
      include: { pricingPlans: { orderBy: { name: "asc" } } }
    });
  });

  it("replaces extraction data in a transaction", async () => {
    const calls: string[] = [];
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(prisma)),
      snapshot: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(async () => {
          calls.push("snapshot.update");
        })
      },
      pricingPlan: {
        deleteMany: vi.fn(async () => {
          calls.push("pricingPlan.deleteMany");
        }),
        createMany: vi.fn(async () => {
          calls.push("pricingPlan.createMany");
        })
      },
      changeEvent: {
        deleteMany: vi.fn(async () => {
          calls.push("changeEvent.deleteMany");
        }),
        createMany: vi.fn(async () => {
          calls.push("changeEvent.createMany");
        })
      }
    };
    const repository = createPrismaReextractRepository(prisma);
    const input: ReplaceSnapshotExtractionInput = {
      snapshotId: "snapshot-1",
      productId: "product-1",
      extractionStatus: "succeeded",
      errorMessage: null,
      pricingPlans: [
        {
          snapshotId: "snapshot-1",
          productId: "product-1",
          name: "Pro",
          priceAmount: 25,
          priceCurrency: "USD",
          billingPeriod: "month",
          rawPriceText: "$25/mo",
          features: [],
          limits: [],
          isFreeTier: false,
          metadata: { segment: [], priceMentions: [] }
        }
      ],
      changeEvents: [
        {
          productId: "product-1",
          previousSnapshotId: "snapshot-previous",
          currentSnapshotId: "snapshot-1",
          detectedAt: new Date("2026-01-03T00:00:00.000Z"),
          changeType: "price_increase",
          severity: "high",
          title: "Pro 套餐价格从 $20/mo 变为 $25/mo",
          summary: "Pro 套餐价格上涨。",
          details: {}
        }
      ]
    };

    await repository.replaceSnapshotExtraction(input);

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(calls).toEqual([
      "pricingPlan.deleteMany",
      "changeEvent.deleteMany",
      "snapshot.update",
      "pricingPlan.createMany",
      "changeEvent.createMany"
    ]);
    expect(prisma.pricingPlan.deleteMany).toHaveBeenCalledWith({
      where: { snapshotId: "snapshot-1" }
    });
    expect(prisma.changeEvent.deleteMany).toHaveBeenCalledWith({
      where: { currentSnapshotId: "snapshot-1" }
    });
    expect(prisma.snapshot.update).toHaveBeenCalledWith({
      where: { id: "snapshot-1" },
      data: {
        extractionStatus: "succeeded",
        errorMessage: null
      }
    });
    expect(prisma.pricingPlan.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          snapshotId: "snapshot-1",
          productId: "product-1",
          name: "Pro",
          priceAmount: 25
        })
      ]
    });
    expect(prisma.changeEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: "product-1",
          currentSnapshotId: "snapshot-1",
          changeType: "price_increase"
        })
      ]
    });
  });
});
