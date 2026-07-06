import { afterEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
const prisma = vi.hoisted(() => ({
  snapshot: {
    findMany
  }
}));

vi.mock("@/lib/prisma", () => ({ prisma }));

describe("GET /api/compare", () => {
  afterEach(() => {
    findMany.mockReset();
  });

  it("requires both snapshot ids", async () => {
    const { GET } = await import("./route");

    const response = await GET(new Request("http://localhost/api/compare?from=old"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "from and to snapshot ids are required"
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("rejects comparing a snapshot to itself", async () => {
    findMany.mockResolvedValue([]);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/compare?from=snapshot-1&to=snapshot-1")
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "from and to snapshot ids must be different"
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns 404 when one of the requested snapshots is missing", async () => {
    findMany.mockResolvedValue([snapshotRecord({ id: "snapshot-old" })]);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/compare?from=snapshot-old&to=snapshot-new")
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Snapshot not found" });
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["snapshot-old", "snapshot-new"] } }
      })
    );
  });

  it("rejects snapshots that belong to different products", async () => {
    findMany.mockResolvedValue([
      snapshotRecord({ id: "snapshot-old", productId: "product-a" }),
      snapshotRecord({ id: "snapshot-new", productId: "product-b" })
    ]);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/compare?from=snapshot-old&to=snapshot-new")
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Snapshots must belong to the same product"
    });
  });

  it("returns a comparison payload for two snapshots from the same product", async () => {
    findMany.mockResolvedValue([
      snapshotRecord({
        id: "snapshot-old",
        fetchedAt: new Date("2026-01-01T00:00:00.000Z"),
        contentHash: "hash-old",
        normalizedText: "Pro\n$20/mo\n10 seats\n",
        pricingPlans: [
          pricingPlanRecord({
            name: "Pro",
            priceAmount: 20,
            rawPriceText: "$20/mo",
            limits: ["10 seats"]
          })
        ]
      }),
      snapshotRecord({
        id: "snapshot-new",
        fetchedAt: new Date("2026-02-01T00:00:00.000Z"),
        contentHash: "hash-new",
        normalizedText: "Pro\n$25/mo\n10 seats\n",
        pricingPlans: [
          pricingPlanRecord({
            name: "Pro",
            priceAmount: 25,
            rawPriceText: "$25/mo",
            limits: ["10 seats"]
          })
        ]
      })
    ]);
    const { GET } = await import("./route");

    const response = await GET(
      new Request("http://localhost/api/compare?from=snapshot-old&to=snapshot-new")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      product: {
        id: "product-1",
        slug: "github",
        name: "GitHub"
      },
      comparison: {
        from: {
          id: "snapshot-old",
          httpStatus: 200,
          contentHash: "hash-old"
        },
        to: {
          id: "snapshot-new",
          httpStatus: 200,
          contentHash: "hash-new"
        },
        summary: {
          addedLines: 1,
          removedLines: 1,
          highSeverityCount: 1
        },
        changeEvents: [
          expect.objectContaining({
            changeType: "price_increase",
            title: "Pro 套餐价格从 $20/mo 变为 $25/mo"
          }),
          expect.objectContaining({
            changeType: "copy_changed"
          })
        ]
      }
    });
  });
});

function snapshotRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "snapshot-old",
    productId: "product-1",
    fetchedAt: new Date("2026-01-01T00:00:00.000Z"),
    httpStatus: 200,
    contentHash: "hash-old",
    normalizedText: "Pro\n$20/mo\n",
    pricingPlans: [pricingPlanRecord()],
    product: {
      id: "product-1",
      slug: "github",
      name: "GitHub"
    },
    ...overrides
  };
}

function pricingPlanRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "plan-1",
    snapshotId: "snapshot-old",
    productId: "product-1",
    name: "Pro",
    priceAmount: 20,
    priceCurrency: "USD",
    billingPeriod: "month",
    rawPriceText: "$20/mo",
    features: [],
    limits: [],
    isFreeTier: false,
    metadata: {
      segment: [],
      priceMentions: []
    },
    ...overrides
  };
}
