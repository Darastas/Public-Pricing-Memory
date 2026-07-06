const MAX_CRAWL_LIMIT = 100;

export function parseCrawlLimit(args: string[]): number | undefined {
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  if (!limitArg) {
    return undefined;
  }

  const value = Number(limitArg.split("=")[1]);
  if (!Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(1, Math.min(MAX_CRAWL_LIMIT, Math.floor(value)));
}
