import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const severity = searchParams.get("severity");
  const limit = Math.min(Number(searchParams.get("limit") ?? 30), 100);

  const changes = await prisma.changeEvent.findMany({
    where: {
      ...(productId ? { productId } : {}),
      ...(isSeverity(severity) ? { severity } : {})
    },
    orderBy: { detectedAt: "desc" },
    take: Number.isFinite(limit) && limit > 0 ? limit : 30,
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          category: true
        }
      }
    }
  });

  return NextResponse.json({ changes });
}

function isSeverity(value: string | null): value is "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high";
}
