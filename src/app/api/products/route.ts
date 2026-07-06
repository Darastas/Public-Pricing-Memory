import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { isAdminAuthorized, tokenFromRequest } from "@/lib/auth/admin-token";
import { serializePricingPlan } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";
import { buildSlug, normalizeHttpUrl } from "@/lib/url";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const status = parseProductStatus(searchParams.get("status"));
  if (status === "unsupported") {
    return NextResponse.json(
      { error: "Unsupported product status filter" },
      { status: 400 }
    );
  }

  const products = await prisma.product.findMany({
    where: buildProductWhere(query, status),
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 1,
        select: {
          id: true,
          fetchedAt: true,
          httpStatus: true,
          contentHash: true,
          extractionStatus: true,
          errorMessage: true,
          pricingPlans: true
        }
      },
      changes: {
        orderBy: { detectedAt: "desc" },
        take: 1
      },
      crawlJobs: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: {
        select: {
          snapshots: true,
          changes: true,
          crawlJobs: true
        }
      }
    }
  });

  return NextResponse.json({
    products: products.map((product) => {
      const latestSnapshot = product.snapshots[0] ?? null;
      return {
        id: product.id,
        slug: product.slug,
        name: product.name,
        websiteUrl: product.websiteUrl,
        pricingUrl: product.pricingUrl,
        category: product.category,
        status: product.status,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        latestSnapshot: latestSnapshot
          ? {
              id: latestSnapshot.id,
              fetchedAt: latestSnapshot.fetchedAt,
              httpStatus: latestSnapshot.httpStatus,
              contentHash: latestSnapshot.contentHash,
              extractionStatus: latestSnapshot.extractionStatus,
              errorMessage: latestSnapshot.errorMessage,
              pricingPlans: latestSnapshot.pricingPlans.map(serializePricingPlan)
            }
          : null,
        latestChange: product.changes[0] ?? null,
        latestCrawlJob: product.crawlJobs[0] ?? null,
        counts: product._count
      };
    })
  });
}

function buildProductWhere(
  query: string | undefined,
  status: "active" | "paused" | "failed" | null
): Prisma.ProductWhereInput | undefined {
  if (!query && !status) return undefined;

  return {
    ...(status ? { status } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { slug: { contains: query, mode: "insensitive" as const } },
            { category: { contains: query, mode: "insensitive" as const } }
          ]
        }
      : {})
  };
}

function parseProductStatus(
  value: string | null
): "active" | "paused" | "failed" | "unsupported" | null {
  if (!value) return null;
  if (value === "active" || value === "paused" || value === "failed") {
    return value;
  }
  return "unsupported";
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(tokenFromRequest(request), process.env.ADMIN_TOKEN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseProductBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const product = await prisma.product.create({
      data: {
        slug: parsed.slug,
        name: parsed.name,
        websiteUrl: parsed.websiteUrl,
        pricingUrl: parsed.pricingUrl,
        category: parsed.category,
        status: "active"
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "Product slug already exists" },
        { status: 409 }
      );
    }

    throw error;
  }
}

function parseProductBody(body: unknown):
  | {
      name: string;
      slug: string;
      websiteUrl: string;
      pricingUrl: string;
      category: string;
    }
  | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Request body must be an object" };
  }

  const input = body as Record<string, unknown>;
  const name = stringField(input.name);
  const category = stringField(input.category) ?? "Uncategorized";
  const slug = stringField(input.slug) ?? (name ? buildSlug(name) : null);

  if (!name) return { error: "name is required" };
  if (!slug) return { error: "slug is required" };

  try {
    return {
      name,
      slug,
      websiteUrl: normalizeHttpUrl(requiredString(input.websiteUrl, "websiteUrl")),
      pricingUrl: normalizeHttpUrl(requiredString(input.pricingUrl, "pricingUrl")),
      category
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Invalid product input"
    };
  }
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredString(value: unknown, field: string): string {
  const parsed = stringField(value);
  if (!parsed) {
    throw new Error(`${field} is required`);
  }
  return parsed;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2002"
  );
}
