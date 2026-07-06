import type { FetchPageResult } from "./run-crawl";

export type FetchResponseLike = {
  status: number;
  url?: string;
  text(): Promise<string>;
};

export type FetchLike = (
  url: string,
  init: {
    signal: AbortSignal;
    headers: Record<string, string>;
    redirect: "follow";
  }
) => Promise<FetchResponseLike>;

export function createFetchPage(options: {
  timeoutMs?: number;
  fetchImpl?: FetchLike;
  userAgent?: string;
} = {}) {
  const {
    timeoutMs = 15_000,
    fetchImpl = fetch as FetchLike,
    userAgent = "PublicPricingMemoryBot/0.1 (+https://github.com/Darastas/Public-Pricing-Memory)"
  } = options;

  return async function fetchPage(url: string): Promise<FetchPageResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          accept: "text/html,application/xhtml+xml",
          "user-agent": userAgent
        }
      });
      const html = await response.text();

      return {
        finalUrl: response.url || url,
        httpStatus: response.status,
        html
      };
    } catch (error) {
      return {
        finalUrl: url,
        httpStatus: null,
        html: "",
        errorMessage: controller.signal.aborted
          ? `Fetch timed out after ${timeoutMs}ms`
          : error instanceof Error
            ? error.message
            : "Unknown fetch failure"
      };
    } finally {
      clearTimeout(timeout);
    }
  };
}

export const fetchPricingPage = createFetchPage();
