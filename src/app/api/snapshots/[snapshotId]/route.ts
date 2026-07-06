import { NextResponse } from "next/server";
import { serializePricingPlan } from "@/lib/api/serialize";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ snapshotId: string }> }
) {
  const { snapshotId } = await params;
  const snapshot = await prisma.snapshot.findUnique({
    where: { id: snapshotId },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          pricingUrl: true
        }
      },
      pricingPlans: {
        orderBy: { name: "asc" }
      }
    }
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  return NextResponse.json({
    snapshot: {
      id: snapshot.id,
      productId: snapshot.productId,
      product: snapshot.product,
      fetchedAt: snapshot.fetchedAt,
      sourceUrl: snapshot.sourceUrl,
      httpStatus: snapshot.httpStatus,
      contentHash: snapshot.contentHash,
      rawHtmlStorageKey: snapshot.rawHtmlStorageKey,
      rawHtml: snapshot.rawHtml,
      normalizedText: snapshot.normalizedText,
      screenshotStorageKey: snapshot.screenshotStorageKey,
      extractionStatus: snapshot.extractionStatus,
      errorMessage: snapshot.errorMessage,
      pricingPlans: snapshot.pricingPlans.map(serializePricingPlan)
    }
  });
}
