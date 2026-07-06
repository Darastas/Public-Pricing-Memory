import { describe, expect, it } from "vitest";
import { createFetchPage } from "./fetcher";

describe("crawler fetcher", () => {
  it("returns HTTP status, final URL, and HTML body", async () => {
    const fetchPage = createFetchPage({
      fetchImpl: async () => ({
        status: 200,
        url: "https://example.com/pricing?ref=final",
        text: async () => "<main><h1>Pricing</h1></main>"
      })
    });

    await expect(fetchPage("https://example.com/pricing")).resolves.toEqual({
      finalUrl: "https://example.com/pricing?ref=final",
      httpStatus: 200,
      html: "<main><h1>Pricing</h1></main>"
    });
  });

  it("requests markdown sources as markdown so docs pricing tables stay machine-readable", async () => {
    let acceptHeader = "";
    const fetchPage = createFetchPage({
      fetchImpl: async (_url, init) => {
        acceptHeader = init.headers.accept;
        return {
          status: 200,
          url: "https://example.com/pricing.md",
          text: async () => "# Pricing"
        };
      }
    });

    await fetchPage("https://example.com/pricing.md");

    expect(acceptHeader).toContain("text/markdown");
  });

  it("captures network errors as failed fetch results", async () => {
    const fetchPage = createFetchPage({
      renderedFallback: false,
      fetchImpl: async () => {
        throw new Error("DNS lookup failed");
      }
    });

    await expect(fetchPage("https://example.invalid/pricing")).resolves.toEqual({
      finalUrl: "https://example.invalid/pricing",
      httpStatus: null,
      html: "",
      errorMessage: "DNS lookup failed"
    });
  });

  it("uses a rendered fallback when the static HTML has no meaningful text", async () => {
    const fetchPage = createFetchPage({
      fetchImpl: async () => ({
        status: 200,
        url: "https://example.com/pricing",
        text: async () =>
          "<html><body><div id=\"app\"></div><script>renderPricing()</script></body></html>"
      }),
      renderPage: async (url) => ({
        finalUrl: `${url}?rendered=1`,
        httpStatus: 200,
        html: "<main><h1>Pricing</h1><h2>Pro</h2><p>$20/mo</p></main>"
      })
    });

    await expect(fetchPage("https://example.com/pricing")).resolves.toEqual({
      finalUrl: "https://example.com/pricing?rendered=1",
      httpStatus: 200,
      html: "<main><h1>Pricing</h1><h2>Pro</h2><p>$20/mo</p></main>"
    });
  });

  it("uses a rendered fallback when the static request fails but browser rendering succeeds", async () => {
    const fetchPage = createFetchPage({
      fetchImpl: async () => {
        throw new Error("fetch failed");
      },
      renderPage: async (url) => ({
        finalUrl: `${url}?rendered=1`,
        httpStatus: 200,
        html: "<main><h1>Pricing</h1><h2>Pro</h2><p>$20/mo</p></main>"
      })
    });

    await expect(fetchPage("https://example.com/pricing")).resolves.toEqual({
      finalUrl: "https://example.com/pricing?rendered=1",
      httpStatus: 200,
      html: "<main><h1>Pricing</h1><h2>Pro</h2><p>$20/mo</p></main>"
    });
  });

  it("uses a rendered fallback when the static request is blocked", async () => {
    const fetchPage = createFetchPage({
      fetchImpl: async () => ({
        status: 403,
        url: "https://example.com/pricing",
        text: async () => "Forbidden"
      }),
      renderPage: async (url) => ({
        finalUrl: `${url}?rendered=1`,
        httpStatus: 200,
        html: "<main><h1>Pricing</h1><h2>Team</h2><p>$50/mo</p></main>"
      })
    });

    await expect(fetchPage("https://example.com/pricing")).resolves.toEqual({
      finalUrl: "https://example.com/pricing?rendered=1",
      httpStatus: 200,
      html: "<main><h1>Pricing</h1><h2>Team</h2><p>$50/mo</p></main>"
    });
  });

  it("keeps the static fetch result when the rendered fallback fails", async () => {
    const fetchPage = createFetchPage({
      fetchImpl: async () => ({
        status: 200,
        url: "https://example.com/pricing",
        text: async () => "<html><body><div id=\"app\"></div></body></html>"
      }),
      renderPage: async () => {
        throw new Error("Browser executable missing");
      }
    });

    await expect(fetchPage("https://example.com/pricing")).resolves.toEqual({
      finalUrl: "https://example.com/pricing",
      httpStatus: 200,
      html: "<html><body><div id=\"app\"></div></body></html>",
      errorMessage: "Rendered fallback failed: Browser executable missing"
    });
  });

  it("aborts requests that exceed the configured timeout", async () => {
    const fetchPage = createFetchPage({
      timeoutMs: 1,
      renderedFallback: false,
      fetchImpl: async (_url, init) =>
        new Promise((_, reject) => {
          init.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        })
    });

    const result = await fetchPage("https://example.com/pricing");

    expect(result).toMatchObject({
      finalUrl: "https://example.com/pricing",
      httpStatus: null,
      html: "",
      errorMessage: "Fetch timed out after 1ms"
    });
  });
});
