import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/auth/admin-token";
import { fetchPricingPage } from "@/lib/crawler/fetcher";
import { createPrismaCrawlRepository } from "@/lib/crawler/prisma-repository";
import { runCrawl } from "@/lib/crawler/run-crawl";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return runCronBatch(request);
}

export async function POST(request: Request) {
  return runCronBatch(request);
}

async function runCronBatch(request: Request) {
  const { searchParams } = new URL(request.url);
  const providedToken =
    bearerToken(request) ??
    request.headers.get("x-cron-secret") ??
    searchParams.get("secret") ??
    undefined;

  if (!isAdminAuthorized(providedToken, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = clampNumber(searchParams.get("limit"), 1, 10, 3);
  const cooldownHours = clampNumber(searchParams.get("cooldownHours"), 1, 168, 12);
  const cooldownCutoff = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
  const candidates = await prisma.product.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "asc" },
    take: limit * 5,
    include: {
      crawlJobs: {
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });
  const eligible = candidates.filter((product) => {
    const [latestJob] = product.crawlJobs;
    const latestStartedAt = latestJob?.startedAt ?? latestJob?.createdAt;
    return !latestStartedAt || latestStartedAt < cooldownCutoff;
  });
  const selected = eligible.slice(0, limit);
  const repository = createPrismaCrawlRepository(prisma);
  const results = [];

  for (const product of selected) {
    try {
      const result = await runCrawl(product.id, {
        repository,
        fetchPage: fetchPricingPage
      });
      results.push({ productId: product.id, slug: product.slug, result });
    } catch (error) {
      results.push({
        productId: product.id,
        slug: product.slug,
        error: error instanceof Error ? error.message : "Crawl failed"
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    skippedDueToCooldown: candidates.length - eligible.length,
    cooldownHours,
    results
  });
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null;
}

function clampNumber(
  value: string | null,
  min: number,
  max: number,
  fallback: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}
