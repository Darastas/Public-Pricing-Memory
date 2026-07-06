import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractPricingPlans } from "../extract/pricing";
import { createContentHash, htmlToNormalizedText } from "../normalize";
import { generateChangeEvents } from "./pricing-diff";

const fixture = (name: string) =>
  readFileSync(join(process.cwd(), "src", "__fixtures__", name), "utf8");

describe("pricing diff", () => {
  it("detects price increases, added and removed plans, and free tier limit changes from fixtures", () => {
    const oldText = htmlToNormalizedText(fixture("pricing-old.html"));
    const newText = htmlToNormalizedText(fixture("pricing-new.html"));

    const events = generateChangeEvents({
      previous: {
        id: "old",
        httpStatus: 200,
        contentHash: createContentHash(oldText),
        normalizedText: oldText,
        plans: extractPricingPlans(oldText)
      },
      current: {
        id: "new",
        httpStatus: 200,
        contentHash: createContentHash(newText),
        normalizedText: newText,
        plans: extractPricingPlans(newText)
      }
    });

    expect(events.map((event) => event.changeType)).toEqual(
      expect.arrayContaining([
        "price_increase",
        "plan_added",
        "plan_removed",
        "free_tier_changed",
        "usage_limit_changed",
        "copy_changed"
      ])
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        changeType: "price_increase",
        severity: "high",
        title: "Pro 套餐价格从 $20/mo 变为 $25/mo"
      })
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        changeType: "plan_added",
        title: "新增 Team 套餐"
      })
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        changeType: "plan_removed",
        title: "Enterprise 套餐区域被移除"
      })
    );
  });

  it("returns no change events when content hash is unchanged", () => {
    const text = "Free\n$0 / month";
    const hash = createContentHash(text);

    expect(
      generateChangeEvents({
        previous: {
          id: "a",
          httpStatus: 200,
          contentHash: hash,
          normalizedText: text,
          plans: extractPricingPlans(text)
        },
        current: {
          id: "b",
          httpStatus: 200,
          contentHash: hash,
          normalizedText: "Free $0 / month",
          plans: extractPricingPlans(text)
        }
      })
    ).toEqual([]);
  });

  it("marks a previously reachable pricing page as unreachable", () => {
    const events = generateChangeEvents({
      previous: {
        id: "old",
        httpStatus: 200,
        contentHash: "old",
        normalizedText: "Pro\n$20/mo",
        plans: extractPricingPlans("Pro\n$20/mo")
      },
      current: {
        id: "new",
        httpStatus: 503,
        contentHash: "new",
        normalizedText: "",
        plans: []
      }
    });

    expect(events).toContainEqual(
      expect.objectContaining({
        changeType: "page_unreachable",
        severity: "high"
      })
    );
  });
});
