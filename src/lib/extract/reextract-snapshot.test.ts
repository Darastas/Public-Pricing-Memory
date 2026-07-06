import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractPricingPlans } from "./pricing";
import { htmlToNormalizedText, createContentHash } from "../normalize";
import {
  reextractSnapshot,
  type ReextractSnapshotRepository
} from "./reextract-snapshot";

const fixture = (name: string) =>
  readFileSync(join(process.cwd(), "src", "__fixtures__", name), "utf8");

function createRepository(): ReextractSnapshotRepository & {
  replacements: Parameters<ReextractSnapshotRepository["replaceSnapshotExtraction"]>[0][];
} {
  const previousText = htmlToNormalizedText(fixture("pricing-old.html"));
  const currentText = htmlToNormalizedText(fixture("pricing-new.html"));
  const replacements: Parameters<
    ReextractSnapshotRepository["replaceSnapshotExtraction"]
  >[0][] = [];

  return {
    replacements,
    async getSnapshot(snapshotId) {
      if (snapshotId !== "snapshot-current") return null;
      return {
        id: "snapshot-current",
        productId: "product-1",
        fetchedAt: new Date("2026-01-02T00:00:00.000Z"),
        httpStatus: 200,
        contentHash: createContentHash(currentText),
        normalizedText: currentText,
        pricingPlans: [
          {
            name: "Stale",
            priceAmount: 99,
            priceCurrency: "USD",
            billingPeriod: "month",
            rawPriceText: "$99/mo",
            features: [],
            limits: [],
            isFreeTier: false,
            metadata: { segment: [], priceMentions: [] }
          }
        ]
      };
    },
    async getPreviousSnapshot() {
      return {
        id: "snapshot-previous",
        productId: "product-1",
        fetchedAt: new Date("2026-01-01T00:00:00.000Z"),
        httpStatus: 200,
        contentHash: createContentHash(previousText),
        normalizedText: previousText,
        pricingPlans: extractPricingPlans(previousText)
      };
    },
    async replaceSnapshotExtraction(input) {
      replacements.push(input);
    }
  };
}

describe("reextractSnapshot", () => {
  it("replaces snapshot plans and regenerates change events from the previous snapshot", async () => {
    const repository = createRepository();

    const result = await reextractSnapshot("snapshot-current", {
      repository,
      now: () => new Date("2026-01-03T00:00:00.000Z")
    });

    expect(result).toMatchObject({
      snapshotId: "snapshot-current",
      productId: "product-1",
      status: "succeeded",
      planCount: 3
    });
    expect(repository.replacements).toHaveLength(1);
    expect(repository.replacements[0]).toMatchObject({
      snapshotId: "snapshot-current",
      productId: "product-1",
      extractionStatus: "succeeded",
      errorMessage: null
    });
    expect(repository.replacements[0].pricingPlans.map((plan) => plan.name)).toEqual([
      "Free",
      "Pro",
      "Team"
    ]);
    expect(repository.replacements[0].changeEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          previousSnapshotId: "snapshot-previous",
          currentSnapshotId: "snapshot-current",
          changeType: "price_increase",
          title: "Pro 套餐价格从 $20/mo 变为 $25/mo"
        }),
        expect.objectContaining({
          previousSnapshotId: "snapshot-previous",
          currentSnapshotId: "snapshot-current",
          changeType: "plan_added",
          title: "新增 Team 套餐"
        }),
        expect.objectContaining({
          previousSnapshotId: "snapshot-previous",
          currentSnapshotId: "snapshot-current",
          changeType: "plan_removed",
          title: "Enterprise 套餐区域被移除"
        })
      ])
    );
  });
});
