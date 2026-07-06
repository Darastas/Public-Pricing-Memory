import { describe, expect, it, vi } from "vitest";
import { createPrismaCrawlRepository } from "./prisma-repository";

describe("Prisma crawl repository", () => {
  it("loads the latest snapshot with pricing plans converted to crawler records", async () => {
    const prisma = {
      snapshot: {
        findFirst: vi.fn(async () => ({
          id: "snapshot-1",
          productId: "product-1",
          httpStatus: 200,
          contentHash: "hash",
          normalizedText: "Pro\n$20/mo",
          pricingPlans: [
            {
              name: "Pro",
              priceAmount: { toNumber: () => 20 },
              priceCurrency: "USD",
              billingPeriod: "month",
              rawPriceText: "$20/mo",
              features: ["SSO support"],
              limits: ["10 seats included"],
              isFreeTier: false,
              metadata: { segment: ["$20/mo"], priceMentions: [] }
            }
          ]
        }))
      }
    };

    const repository = createPrismaCrawlRepository(prisma);

    await expect(repository.getLatestSnapshot("product-1")).resolves.toEqual({
      id: "snapshot-1",
      productId: "product-1",
      httpStatus: 200,
      contentHash: "hash",
      normalizedText: "Pro\n$20/mo",
      pricingPlans: [
        {
          name: "Pro",
          priceAmount: 20,
          priceCurrency: "USD",
          billingPeriod: "month",
          rawPriceText: "$20/mo",
          features: ["SSO support"],
          limits: ["10 seats included"],
          isFreeTier: false,
          metadata: { segment: ["$20/mo"], priceMentions: [] }
        }
      ]
    });
    expect(prisma.snapshot.findFirst).toHaveBeenCalledWith({
      where: { productId: "product-1" },
      orderBy: { fetchedAt: "desc" },
      include: { pricingPlans: { orderBy: { name: "asc" } } }
    });
  });

  it("persists snapshots, pricing plans, change events, and crawl job updates", async () => {
    const prisma = {
      snapshot: {
        create: vi.fn(async ({ data }) => ({
          id: "snapshot-1",
          productId: data.productId,
          httpStatus: data.httpStatus,
          contentHash: data.contentHash,
          normalizedText: data.normalizedText,
          pricingPlans: []
        }))
      },
      pricingPlan: {
        createMany: vi.fn(async () => ({ count: 1 }))
      },
      changeEvent: {
        createMany: vi.fn(async () => ({ count: 1 }))
      },
      crawlJob: {
        create: vi.fn(async () => ({ id: "job-1" })),
        update: vi.fn(async () => ({ id: "job-1" }))
      }
    };
    const repository = createPrismaCrawlRepository(prisma);
    const fetchedAt = new Date("2026-01-01T00:00:00.000Z");

    await repository.createCrawlJob("product-1");
    await repository.updateCrawlJob("job-1", {
      status: "succeeded",
      finishedAt: fetchedAt,
      errorMessage: null,
      logs: [{ at: fetchedAt.toISOString(), level: "info", message: "done" }]
    });
    await repository.createSnapshot({
      productId: "product-1",
      fetchedAt,
      sourceUrl: "https://example.com/pricing",
      httpStatus: 200,
      contentHash: "hash",
      rawHtmlStorageKey: null,
      rawHtml: "<main>Pricing</main>",
      normalizedText: "Pricing",
      screenshotStorageKey: null,
      extractionStatus: "succeeded",
      errorMessage: null
    });
    await repository.createPricingPlans([
      {
        snapshotId: "snapshot-1",
        productId: "product-1",
        name: "Pro",
        priceAmount: 20,
        priceCurrency: "USD",
        billingPeriod: "month",
        rawPriceText: "$20/mo",
        features: [],
        limits: [],
        isFreeTier: false,
        metadata: { segment: [], priceMentions: [] }
      }
    ]);
    await repository.createChangeEvents([
      {
        productId: "product-1",
        previousSnapshotId: null,
        currentSnapshotId: "snapshot-1",
        detectedAt: fetchedAt,
        changeType: "structure_changed",
        severity: "low",
        title: "创建首个价格快照",
        summary: "首次抓取并建立价格页面基线。",
        details: {}
      }
    ]);

    expect(prisma.crawlJob.create).toHaveBeenCalledWith({
      data: {
        productId: "product-1",
        status: "queued",
        logs: []
      },
      select: { id: true }
    });
    expect(prisma.crawlJob.update).toHaveBeenCalledWith({
      where: { id: "job-1" },
      data: {
        status: "succeeded",
        finishedAt: fetchedAt,
        errorMessage: null,
        logs: [{ at: fetchedAt.toISOString(), level: "info", message: "done" }]
      }
    });
    expect(prisma.snapshot.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: "product-1",
        contentHash: "hash",
        extractionStatus: "succeeded"
      }),
      include: { pricingPlans: true }
    });
    expect(prisma.pricingPlan.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          snapshotId: "snapshot-1",
          productId: "product-1",
          name: "Pro",
          priceAmount: 20
        })
      ]
    });
    expect(prisma.changeEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: "product-1",
          currentSnapshotId: "snapshot-1",
          changeType: "structure_changed"
        })
      ]
    });
  });
});
