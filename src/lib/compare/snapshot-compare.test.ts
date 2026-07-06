import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractPricingPlans } from "../extract/pricing";
import { createContentHash, htmlToNormalizedText } from "../normalize";
import { buildSnapshotCompare } from "./snapshot-compare";

const fixture = (name: string) =>
  readFileSync(join(process.cwd(), "src", "__fixtures__", name), "utf8");

describe("snapshot compare", () => {
  it("builds text diff chunks and structured pricing change events", () => {
    const fromText = htmlToNormalizedText(fixture("pricing-old.html"));
    const toText = htmlToNormalizedText(fixture("pricing-new.html"));

    const comparison = buildSnapshotCompare({
      from: {
        id: "old",
        fetchedAt: new Date("2026-01-01T00:00:00.000Z"),
        httpStatus: 200,
        contentHash: createContentHash(fromText),
        normalizedText: fromText,
        pricingPlans: extractPricingPlans(fromText)
      },
      to: {
        id: "new",
        fetchedAt: new Date("2026-02-01T00:00:00.000Z"),
        httpStatus: 200,
        contentHash: createContentHash(toText),
        normalizedText: toText,
        pricingPlans: extractPricingPlans(toText)
      }
    });

    expect(comparison.diffChunks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "removed" }),
        expect.objectContaining({ type: "added" })
      ])
    );
    expect(comparison.changeEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          changeType: "price_increase",
          title: "Pro 套餐价格从 $20/mo 变为 $25/mo"
        }),
        expect.objectContaining({
          changeType: "plan_added",
          title: "新增 Team 套餐"
        })
      ])
    );
    expect(comparison.summary.highSeverityCount).toBeGreaterThan(0);
  });
});
