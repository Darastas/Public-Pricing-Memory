import { describe, expect, it } from "vitest";
import { createContentHash, htmlToNormalizedText } from "./normalize";

describe("HTML normalization", () => {
  it("removes script, style, navigation, and footer noise while preserving pricing text", () => {
    const html = `
      <html>
        <head><style>.x{}</style><script>alert(1)</script></head>
        <body>
          <nav>Docs Careers Blog</nav>
          <main>
            <h1>Pricing</h1>
            <section><h2>Pro</h2><p>$20/mo</p><p>50,000 requests included</p></section>
          </main>
          <footer>Privacy Terms</footer>
        </body>
      </html>
    `;

    const text = htmlToNormalizedText(html);

    expect(text).toContain("Pricing");
    expect(text).toContain("Pro");
    expect(text).toContain("$20/mo");
    expect(text).toContain("50,000 requests included");
    expect(text).not.toContain("alert");
    expect(text).not.toContain("Docs Careers Blog");
    expect(text).not.toContain("Privacy Terms");
  });

  it("keeps Chinese pricing vocabulary during normalization", () => {
    const text = htmlToNormalizedText(
      "<main><h2>团队版</h2><p>¥99 每月</p><p>包含 10 个席位</p></main>"
    );

    expect(text).toContain("团队版");
    expect(text).toContain("¥99 每月");
    expect(text).toContain("10 个席位");
  });

  it("generates stable hashes for equivalent whitespace", () => {
    expect(createContentHash("Pro\n$20/mo")).toBe(
      createContentHash("  Pro   $20/mo  ")
    );
  });
});
