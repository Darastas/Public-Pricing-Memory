import { afterEach, describe, expect, it, vi } from "vitest";

const reextractSnapshot = vi.hoisted(() => vi.fn());
const createPrismaReextractRepository = vi.hoisted(() => vi.fn(() => "repository"));
const prisma = vi.hoisted(() => ({ marker: "prisma" }));

vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/auth/admin-token", () => ({
  isAdminAuthorized: (providedToken: string | undefined, configuredToken: string | undefined) =>
    Boolean(configuredToken && providedToken === configuredToken),
  tokenFromRequest: (request: Request) =>
    request.headers.get("authorization")?.replace(/^Bearer\s+/, "") ?? undefined
}));
vi.mock("@/lib/extract/prisma-reextract-repository", () => ({
  createPrismaReextractRepository
}));
vi.mock("@/lib/extract/reextract-snapshot", () => ({
  reextractSnapshot
}));

describe("POST /api/snapshots/[snapshotId]/reextract", () => {
  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.ADMIN_TOKEN;
  });

  it("rejects unauthorized re-extraction requests", async () => {
    process.env.ADMIN_TOKEN = "secret";
    const { POST } = await import("./route");

    const response = await POST(new Request("http://localhost/api"), {
      params: Promise.resolve({ snapshotId: "snapshot-1" })
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(reextractSnapshot).not.toHaveBeenCalled();
  });

  it("runs snapshot re-extraction for authorized requests", async () => {
    process.env.ADMIN_TOKEN = "secret";
    reextractSnapshot.mockResolvedValue({
      snapshotId: "snapshot-1",
      productId: "product-1",
      status: "succeeded",
      planCount: 3,
      changeCount: 4,
      errorMessage: null
    });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { authorization: "Bearer secret" }
      }),
      { params: Promise.resolve({ snapshotId: "snapshot-1" }) }
    );

    await expect(response.json()).resolves.toEqual({
      result: {
        snapshotId: "snapshot-1",
        productId: "product-1",
        status: "succeeded",
        planCount: 3,
        changeCount: 4,
        errorMessage: null
      }
    });
    expect(response.status).toBe(200);
    expect(createPrismaReextractRepository).toHaveBeenCalledWith(prisma);
    expect(reextractSnapshot).toHaveBeenCalledWith("snapshot-1", {
      repository: "repository"
    });
  });
});
