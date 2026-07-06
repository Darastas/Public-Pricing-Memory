import type { FetchPageResult } from "./run-crawl";

export type PlaywrightRenderOptions = {
  timeoutMs?: number;
  userAgent?: string;
  executablePath?: string;
};

const DEFAULT_USER_AGENT =
  "PublicPricingMemoryBot/0.1 (+https://github.com/Darastas/Public-Pricing-Memory)";

export async function renderPricingPageWithPlaywright(
  url: string,
  options: PlaywrightRenderOptions = {}
): Promise<FetchPageResult> {
  const {
    timeoutMs = 20_000,
    userAgent = DEFAULT_USER_AGENT,
    executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
  } = options;
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    executablePath: executablePath || undefined
  });

  try {
    const page = await browser.newPage({ userAgent });
    const response = await page.goto(url, {
      waitUntil: "networkidle",
      timeout: timeoutMs
    });
    const html = await page.content();

    return {
      finalUrl: page.url(),
      httpStatus: response?.status() ?? null,
      html
    };
  } finally {
    await browser.close();
  }
}
