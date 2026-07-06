import { NextResponse } from "next/server";
import { isAdminAuthorized, tokenFromRequest } from "@/lib/auth/admin-token";
import { fetchPricingPage } from "@/lib/crawler/fetcher";
import { createPrismaCrawlRepository } from "@/lib/crawler/prisma-repository";
import { runCrawl } from "@/lib/crawler/run-crawl";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  if (!isAdminAuthorized(tokenFromRequest(request), process.env.ADMIN_TOKEN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productId } = await params;

  try {
    const result = await runCrawl(productId, {
      repository: createPrismaCrawlRepository(prisma),
      fetchPage: fetchPricingPage
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Crawl failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
