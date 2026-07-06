import { describe, expect, it } from "vitest";
import { parseCrawlLimit } from "./crawl-active-config";

describe("crawl-active configuration", () => {
  it("crawls all active products by default", () => {
    expect(parseCrawlLimit([])).toBeUndefined();
  });

  it("clamps explicit crawl limits without changing the default", () => {
    expect(parseCrawlLimit(["--limit=2"])).toBe(2);
    expect(parseCrawlLimit(["--limit=250"])).toBe(100);
    expect(parseCrawlLimit(["--limit=not-a-number"])).toBeUndefined();
  });
});
