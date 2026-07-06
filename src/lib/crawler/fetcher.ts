import type { FetchPageResult } from "./run-crawl";
import { htmlToNormalizedText } from "../normalize";
import { renderPricingPageWithPlaywright } from "./playwright-renderer";

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

export type RenderPageLike = (url: string) => Promise<FetchPageResult>;

export function createFetchPage(options: {
  timeoutMs?: number;
  fetchImpl?: FetchLike;
  renderPage?: RenderPageLike;
  renderedFallback?: boolean;
  minStaticTextLength?: number;
  userAgent?: string;
} = {}) {
  const {
    timeoutMs = 15_000,
    fetchImpl = fetch as FetchLike,
    renderPage = renderPricingPageWithPlaywright,
    renderedFallback = true,
    minStaticTextLength = 1,
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

      const result = {
        finalUrl: response.url || url,
        httpStatus: response.status,
        html
      };

      return maybeUseRenderedFallback(result, {
        renderPage,
        renderedFallback,
        minStaticTextLength
      });
    } catch (error) {
      const result = {
        finalUrl: url,
        httpStatus: null,
        html: "",
        errorMessage: controller.signal.aborted
          ? `Fetch timed out after ${timeoutMs}ms`
          : error instanceof Error
            ? error.message
            : "Unknown fetch failure"
      };

      return maybeUseRenderedFallback(result, {
        renderPage,
        renderedFallback,
        minStaticTextLength
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}

export const fetchPricingPage = createFetchPage();

async function maybeUseRenderedFallback(
  result: FetchPageResult,
  options: {
    renderPage: RenderPageLike;
    renderedFallback: boolean;
    minStaticTextLength: number;
  }
): Promise<FetchPageResult> {
  if (!options.renderedFallback || !shouldUseRenderedFallback(result, options.minStaticTextLength)) {
    return result;
  }

  try {
    return await options.renderPage(result.finalUrl);
  } catch (error) {
    const fallbackMessage =
      error instanceof Error ? error.message : "Unknown rendered fallback failure";

    return {
      ...result,
      errorMessage: appendErrorMessage(
        result.errorMessage,
        `Rendered fallback failed: ${fallbackMessage}`
      )
    };
  }
}

function shouldUseRenderedFallback(
  result: FetchPageResult,
  minStaticTextLength: number
): boolean {
  if (!isReachable(result.httpStatus)) {
    return false;
  }

  const normalizedText = result.html ? htmlToNormalizedText(result.html) : "";
  if (normalizedText.length < minStaticTextLength) {
    return true;
  }

  return /enable javascript|requires javascript|please turn on javascript/i.test(
    normalizedText || result.html
  );
}

function isReachable(status: number | null): boolean {
  return typeof status === "number" && status >= 200 && status < 400;
}

function appendErrorMessage(
  current: string | undefined,
  addition: string
): string {
  return current ? `${current}; ${addition}` : addition;
}
