import { createHash } from "node:crypto";
import * as cheerio from "cheerio";

const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "iframe",
  "nav",
  "footer",
  "header",
  "[aria-hidden='true']",
  "[hidden]"
];

const BLOCK_SELECTORS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "li",
  "td",
  "th",
  "dt",
  "dd",
  "button",
  "a",
  "span"
];

export function normalizeText(input: string): string {
  return input
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\r\f\v]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToNormalizedText(html: string): string {
  if (looksLikeMarkdownOrMdx(html)) {
    return normalizeText(html);
  }

  if (!looksLikeHtml(html)) {
    return normalizeText(html);
  }

  const $ = cheerio.load(html);

  $(NOISE_SELECTORS.join(",")).remove();

  const root = $("main").first().length ? $("main").first() : $("body");
  const lines: string[] = [];

  root.find(BLOCK_SELECTORS.join(",")).each((_, element) => {
    const text = normalizeText($(element).text());
    if (text) {
      lines.push(text);
    }
  });

  if (lines.length === 0) {
    const fallback = normalizeText(root.text());
    return fallback;
  }

  return normalizeText(dedupeAdjacent(lines).join("\n"));
}

export function createContentHash(text: string): string {
  const hashInput = normalizeText(text).replace(/\s+/g, " ");
  return createHash("sha256").update(hashInput).digest("hex");
}

function dedupeAdjacent(lines: string[]): string[] {
  const output: string[] = [];
  for (const line of lines) {
    if (output[output.length - 1] !== line) {
      output.push(line);
    }
  }
  return output;
}

function looksLikeHtml(input: string): boolean {
  return /<(?:!doctype|html|head|body|main|section|article|div|table|tr|td|p|h[1-6]|span|a|ul|ol|li)\b/i.test(
    input
  );
}

function looksLikeMarkdownOrMdx(input: string): boolean {
  if (/<(?:!doctype|html|body)\b/i.test(input)) {
    return false;
  }

  const trimmed = input.trimStart();
  return (
    /^[#>]/.test(trimmed) ||
    /(?:^|\n)export\s+const\s+\w+/.test(input) ||
    /<DocTable\b|rows=\{\[/.test(input)
  );
}
