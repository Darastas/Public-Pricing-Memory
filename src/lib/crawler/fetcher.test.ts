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

  it("captures network errors as failed fetch results", async () => {
    const fetchPage = createFetchPage({
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

  it("aborts requests that exceed the configured timeout", async () => {
    const fetchPage = createFetchPage({
      timeoutMs: 1,
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
