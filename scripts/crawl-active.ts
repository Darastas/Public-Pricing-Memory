import { fetchPricingPage } from "../src/lib/crawler/fetcher";
import { createPrismaCrawlRepository } from "../src/lib/crawler/prisma-repository";
import { runCrawl } from "../src/lib/crawler/run-crawl";
import { prisma } from "../src/lib/prisma";

const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = clamp(Number(limitArg?.split("=")[1] ?? 3), 1, 20);
const repository = createPrismaCrawlRepository(prisma);

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "active" },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true
    }
  });

  for (const product of products) {
    try {
      const result = await runCrawl(product.id, {
        repository,
        fetchPage: fetchPricingPage
      });
      console.log(
        `[${product.slug}] ${result.status}: ${result.planCount} plans, ${result.changeCount} changes`
      );
    } catch (error) {
      console.error(
        `[${product.slug}] failed: ${
          error instanceof Error ? error.message : "Unknown crawl failure"
        }`
      );
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
