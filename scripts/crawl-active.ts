import "dotenv/config";
import { fetchPricingPage } from "../src/lib/crawler/fetcher";
import { createPrismaCrawlRepository } from "../src/lib/crawler/prisma-repository";
import { runCrawl } from "../src/lib/crawler/run-crawl";
import { prisma } from "../src/lib/prisma";
import { parseCrawlLimit } from "../src/scripts/crawl-active-config";

const limit = parseCrawlLimit(process.argv);
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

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
