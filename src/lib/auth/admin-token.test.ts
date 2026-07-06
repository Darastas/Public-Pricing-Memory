import { describe, expect, it } from "vitest";
import { isAdminAuthorized } from "./admin-token";

describe("admin token authorization", () => {
  it("accepts matching tokens", () => {
    expect(isAdminAuthorized("secret", "secret", "production")).toBe(true);
  });

  it("rejects missing or mismatched tokens", () => {
    expect(isAdminAuthorized(undefined, "secret", "production")).toBe(false);
    expect(isAdminAuthorized("wrong", "secret", "production")).toBe(false);
  });

  it("does not allow dangerous production writes when ADMIN_TOKEN is missing", () => {
    expect(isAdminAuthorized(undefined, undefined, "production")).toBe(false);
  });

  it("allows local development writes when ADMIN_TOKEN is intentionally absent", () => {
    expect(isAdminAuthorized(undefined, undefined, "development")).toBe(true);
  });
});
