import { NextResponse } from "next/server";
import { serializePricingPlan, type PricingPlanLike } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      snapshots: {
        orderBy: { fetchedAt: "desc" },
        take: 30,
        include: {
          pricingPlans: {
            orderBy: { name: "asc" }
          }
        }
      },
      changes: {
        orderBy: { detectedAt: "desc" },
        take: 80
      },
      crawlJobs: {
        orderBy: { createdAt: "desc" },
        take: 20
      }
    }
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const [latestSnapshot] = product.snapshots;

  return NextResponse.json({
    product: {
      id: product.id,
      slug: product.slug,
      name: product.name,
      websiteUrl: product.websiteUrl,
      pricingUrl: product.pricingUrl,
      category: product.category,
      status: product.status,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      currentPlans: latestSnapshot
        ? latestSnapshot.pricingPlans.map(serializePricingPlan)
        : [],
      latestSnapshot: latestSnapshot ? serializeSnapshot(latestSnapshot) : null,
      snapshots: product.snapshots.map(serializeSnapshot),
      changes: product.changes,
      crawlJobs: product.crawlJobs
    }
  });
}

function serializeSnapshot(snapshot: {
  id: string;
  productId: string;
  fetchedAt: Date;
  sourceUrl: string;
  httpStatus: number | null;
  contentHash: string;
  rawHtmlStorageKey: string | null;
  normalizedText: string;
  screenshotStorageKey: string | null;
  extractionStatus: string;
  errorMessage: string | null;
  pricingPlans: PricingPlanLike[];
}) {
  return {
    id: snapshot.id,
    productId: snapshot.productId,
    fetchedAt: snapshot.fetchedAt,
    sourceUrl: snapshot.sourceUrl,
    httpStatus: snapshot.httpStatus,
    contentHash: snapshot.contentHash,
    rawHtmlStorageKey: snapshot.rawHtmlStorageKey,
    normalizedTextPreview: snapshot.normalizedText.slice(0, 600),
    screenshotStorageKey: snapshot.screenshotStorageKey,
    extractionStatus: snapshot.extractionStatus,
    errorMessage: snapshot.errorMessage,
    pricingPlans: snapshot.pricingPlans.map((plan) => serializePricingPlan(plan))
  };
}
