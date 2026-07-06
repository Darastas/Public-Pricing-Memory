import { afterEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const prisma = vi.hoisted(() => ({
  product: {
    findMany
  }
}));

vi.mock("@/lib/prisma", () => ({ prisma }));

function productRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "product-1",
    slug: "github",
    name: "GitHub",
    websiteUrl: "https://github.com",
    pricingUrl: "https://github.com/pricing",
    category: "Developer tools",
    status: "paused",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    snapshots: [],
    changes: [],
    crawlJobs: [],
    _count: {
      snapshots: 0,
      changes: 0,
      crawlJobs: 0
    },
    ...overrides
  };
}

describe("GET /api/products", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("combines text search with a product status filter", async () => {
    findMany.mockResolvedValue([productRecord()]);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/products?q=git&status=paused")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      products: [
        {
          id: "product-1",
          slug: "github",
          status: "paused",
          latestSnapshot: null,
          latestChange: null,
          latestCrawlJob: null
        }
      ]
    });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: "paused",
          OR: [
            { name: { contains: "git", mode: "insensitive" } },
            { slug: { contains: "git", mode: "insensitive" } },
            { category: { contains: "git", mode: "insensitive" } }
          ]
        }
      })
    );
  });

  it("rejects unsupported product status filters", async () => {
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/products?status=archived")
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Unsupported product status filter"
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});
