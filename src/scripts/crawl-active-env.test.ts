import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("crawl-active script environment loading", () => {
  it("loads dotenv before importing the Prisma singleton", () => {
    const source = readFileSync(join(process.cwd(), "scripts", "crawl-active.ts"), "utf8");
    const dotenvImportIndex = source.indexOf('import "dotenv/config";');
    const prismaImportIndex = source.indexOf('from "../src/lib/prisma"');

    expect(dotenvImportIndex).toBeGreaterThanOrEqual(0);
    expect(dotenvImportIndex).toBeLessThan(prismaImportIndex);
  });
});
