import { afterEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const runCrawl = vi.hoisted(() => vi.fn());
const createPrismaCrawlRepository = vi.hoisted(() => vi.fn(() => "repository"));
const fetchPricingPage = vi.hoisted(() => vi.fn());
const prisma = vi.hoisted(() => ({
  product: {
    findMany
  }
}));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/auth/admin-token", () => ({
  isAdminAuthorized: (providedToken: string | undefined, configuredToken: string | undefined) =>
    Boolean(configuredToken && providedToken === configuredToken)
}));
vi.mock("@/lib/crawler/run-crawl", () => ({
  runCrawl
}));
vi.mock("@/lib/crawler/prisma-repository", () => ({
  createPrismaCrawlRepository
}));
vi.mock("@/lib/crawler/fetcher", () => ({
  fetchPricingPage
}));

const now = new Date("2026-07-06T10:00:00.000Z");

describe("POST /api/cron/crawl", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    delete process.env.CRON_SECRET;
  });

  it("rejects requests without the cron secret", async () => {
    process.env.CRON_SECRET = "cron-secret";
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/cron/crawl", { method: "POST" })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(findMany).not.toHaveBeenCalled();
    expect(runCrawl).not.toHaveBeenCalled();
  });

  it("skips cooled down products and continues after individual crawl failures", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    process.env.CRON_SECRET = "cron-secret";
    findMany.mockResolvedValue([
      {
        id: "product-old",
        slug: "old",
        crawlJobs: [{ startedAt: new Date("2026-07-05T10:00:00.000Z") }]
      },
      {
        id: "product-cooldown",
        slug: "cooldown",
        crawlJobs: [{ startedAt: new Date("2026-07-06T09:00:00.000Z") }]
      },
      {
        id: "product-new",
        slug: "new",
        crawlJobs: []
      }
    ]);
    runCrawl.mockImplementation(async (productId: string) => {
      if (productId === "product-old") {
        throw new Error("temporary upstream failure");
      }

      return {
        status: "succeeded",
        jobId: "job-new",
        snapshotId: "snapshot-new",
        contentHash: "hash-new",
        planCount: 2,
        changeCount: 1,
        errorMessage: null
      };
    });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/cron/crawl?limit=2&cooldownHours=12", {
        method: "POST",
        headers: { "x-cron-secret": "cron-secret" }
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      processed: 2,
      skippedDueToCooldown: 1,
      cooldownHours: 12,
      results: [
        {
          productId: "product-old",
          slug: "old",
          error: "temporary upstream failure"
        },
        {
          productId: "product-new",
          slug: "new",
          result: {
            status: "succeeded",
            planCount: 2,
            changeCount: 1
          }
        }
      ]
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        where: { status: "active" }
      })
    );
    expect(createPrismaCrawlRepository).toHaveBeenCalledWith(prisma);
    expect(runCrawl).toHaveBeenCalledTimes(2);
    expect(runCrawl).toHaveBeenNthCalledWith(1, "product-old", {
      repository: "repository",
      fetchPage: fetchPricingPage
    });
    expect(runCrawl).toHaveBeenNthCalledWith(2, "product-new", {
      repository: "repository",
      fetchPage: fetchPricingPage
    });
  });
});
