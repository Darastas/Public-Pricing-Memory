import { NextResponse } from "next/server";
import { toExtractedPricingPlan } from "@/lib/api/serialize";
import { buildSnapshotCompare } from "@/lib/compare/snapshot-compare";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json(
      { error: "from and to snapshot ids are required" },
      { status: 400 }
    );
  }

  const snapshots = await prisma.snapshot.findMany({
    where: {
      id: { in: [from, to] }
    },
    include: {
      pricingPlans: {
        orderBy: { name: "asc" }
      },
      product: {
        select: {
          id: true,
          slug: true,
          name: true
        }
      }
    }
  });

  const fromSnapshot = snapshots.find((snapshot) => snapshot.id === from);
  const toSnapshot = snapshots.find((snapshot) => snapshot.id === to);

  if (!fromSnapshot || !toSnapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  if (fromSnapshot.productId !== toSnapshot.productId) {
    return NextResponse.json(
      { error: "Snapshots must belong to the same product" },
      { status: 400 }
    );
  }

  const comparison = buildSnapshotCompare({
    from: {
      id: fromSnapshot.id,
      fetchedAt: fromSnapshot.fetchedAt,
      httpStatus: fromSnapshot.httpStatus,
      contentHash: fromSnapshot.contentHash,
      normalizedText: fromSnapshot.normalizedText,
      pricingPlans: fromSnapshot.pricingPlans.map(toExtractedPricingPlan)
    },
    to: {
      id: toSnapshot.id,
      fetchedAt: toSnapshot.fetchedAt,
      httpStatus: toSnapshot.httpStatus,
      contentHash: toSnapshot.contentHash,
      normalizedText: toSnapshot.normalizedText,
      pricingPlans: toSnapshot.pricingPlans.map(toExtractedPricingPlan)
    }
  });

  return NextResponse.json({
    product: fromSnapshot.product,
    comparison
  });
}
