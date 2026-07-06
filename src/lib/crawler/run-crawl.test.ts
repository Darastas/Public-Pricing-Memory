import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { extractPricingPlans } from "../extract/pricing";
import { createContentHash, htmlToNormalizedText } from "../normalize";
import { runCrawl, type CrawlRepository } from "./run-crawl";

const fixture = (name: string) =>
  readFileSync(join(process.cwd(), "src", "__fixtures__", name), "utf8");

function createRepository(
  previousSnapshot: Awaited<ReturnType<CrawlRepository["getLatestSnapshot"]>> = null
): CrawlRepository & {
  snapshots: Parameters<CrawlRepository["createSnapshot"]>[0][];
  plans: Parameters<CrawlRepository["createPricingPlans"]>[0];
  changes: Parameters<CrawlRepository["createChangeEvents"]>[0];
  jobUpdates: Parameters<CrawlRepository["updateCrawlJob"]>[1][];
} {
  const snapshots: Parameters<CrawlRepository["createSnapshot"]>[0][] = [];
  const createdPlans: Parameters<CrawlRepository["createPricingPlans"]>[0] = [];
  const createdChanges: Parameters<CrawlRepository["createChangeEvents"]>[0] = [];
  const jobUpdates: Parameters<CrawlRepository["updateCrawlJob"]>[1][] = [];
  const repository: CrawlRepository & {
    snapshots: Parameters<CrawlRepository["createSnapshot"]>[0][];
    plans: Parameters<CrawlRepository["createPricingPlans"]>[0];
    changes: Parameters<CrawlRepository["createChangeEvents"]>[0];
    jobUpdates: Parameters<CrawlRepository["updateCrawlJob"]>[1][];
  } = {
    snapshots,
    plans: createdPlans,
    changes: createdChanges,
    jobUpdates,
    async getProduct() {
      return {
        id: "product-1",
        pricingUrl: "https://example.com/pricing"
      };
    },
    async getLatestSnapshot() {
      return previousSnapshot;
    },
    async createCrawlJob() {
      return { id: "job-1" };
    },
    async updateCrawlJob(_jobId, input) {
      jobUpdates.push(input);
    },
    async createSnapshot(input) {
      snapshots.push(input);
      return {
        id: `snapshot-${snapshots.length}`,
        productId: input.productId,
        httpStatus: input.httpStatus,
        contentHash: input.contentHash,
        normalizedText: input.normalizedText,
        pricingPlans: []
      };
    },
    async createPricingPlans(plans) {
      createdPlans.push(...plans);
    },
    async createChangeEvents(changes) {
      createdChanges.push(...changes);
    }
  };

  return repository;
}

describe("runCrawl", () => {
  it("stores the first successful snapshot, extracted plans, and baseline change event", async () => {
    const html = fixture("pricing-old.html");
    const repository = createRepository();

    const result = await runCrawl("product-1", {
      repository,
      fetchPage: async () => ({
        finalUrl: "https://example.com/pricing",
        html,
        httpStatus: 200
      })
    });

    expect(result.status).toBe("succeeded");
    expect(result.snapshotId).toBe("snapshot-1");
    expect(repository.snapshots[0]).toMatchObject({
      productId: "product-1",
      sourceUrl: "https://example.com/pricing",
      httpStatus: 200,
      rawHtml: html,
      extractionStatus: "succeeded"
    });
    expect(repository.plans.map((plan) => plan.name)).toEqual(
      expect.arrayContaining(["Free", "Pro", "Enterprise"])
    );
    expect(repository.changes).toContainEqual(
      expect.objectContaining({
        changeType: "structure_changed",
        title: "创建首个价格快照"
      })
    );
    expect(repository.jobUpdates.at(-1)).toMatchObject({
      status: "succeeded"
    });
  });

  it("records unchanged snapshots lightly without duplicating change events", async () => {
    const html = fixture("pricing-old.html");
    const normalizedText = htmlToNormalizedText(html);
    const previousSnapshot = {
      id: "previous",
      productId: "product-1",
      httpStatus: 200,
      contentHash: createContentHash(normalizedText),
      normalizedText,
      pricingPlans: extractPricingPlans(normalizedText)
    };
    const repository = createRepository(previousSnapshot);

    const result = await runCrawl("product-1", {
      repository,
      fetchPage: async () => ({
        finalUrl: "https://example.com/pricing",
        html,
        httpStatus: 200
      })
    });

    expect(result.status).toBe("unchanged");
    expect(repository.snapshots[0]).toMatchObject({
      extractionStatus: "unchanged",
      rawHtml: null
    });
    expect(repository.plans).toHaveLength(previousSnapshot.pricingPlans.length);
    expect(repository.changes).toHaveLength(0);
  });

  it("saves an unreachable snapshot, emits a page_unreachable event, and marks the job failed", async () => {
    const previousText = "Pro\n$20/mo";
    const repository = createRepository({
      id: "previous",
      productId: "product-1",
      httpStatus: 200,
      contentHash: createContentHash(previousText),
      normalizedText: previousText,
      pricingPlans: extractPricingPlans(previousText)
    });

    const result = await runCrawl("product-1", {
      repository,
      fetchPage: async () => ({
        finalUrl: "https://example.com/pricing",
        html: "",
        httpStatus: 503
      })
    });

    expect(result.status).toBe("failed");
    expect(repository.snapshots[0]).toMatchObject({
      httpStatus: 503,
      extractionStatus: "failed",
      errorMessage: "Pricing page returned HTTP 503"
    });
    expect(repository.changes).toContainEqual(
      expect.objectContaining({
        changeType: "page_unreachable",
        severity: "high"
      })
    );
    expect(repository.jobUpdates.at(-1)).toMatchObject({
      status: "failed",
      errorMessage: "Pricing page returned HTTP 503"
    });
  });

  it("does not create a crawl job when the product does not exist", async () => {
    const createCrawlJob = vi.fn(async () => ({ id: "job-1" }));
    const repository: CrawlRepository = {
      async getProduct() {
        return null;
      },
      async getLatestSnapshot() {
        return null;
      },
      createCrawlJob,
      async updateCrawlJob() {
        throw new Error("Should not update missing product job");
      },
      async createSnapshot() {
        throw new Error("Should not create missing product snapshot");
      },
      async createPricingPlans() {
        throw new Error("Should not create missing product plans");
      },
      async createChangeEvents() {
        throw new Error("Should not create missing product changes");
      }
    };

    await expect(
      runCrawl("missing-product", {
        repository,
        fetchPage: async () => {
          throw new Error("Should not fetch missing product");
        }
      })
    ).rejects.toThrow("Product missing-product not found");
    expect(createCrawlJob).not.toHaveBeenCalled();
  });
});
