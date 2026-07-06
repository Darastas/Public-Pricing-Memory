import { timingSafeEqual } from "node:crypto";

export function isAdminAuthorized(
  providedToken: string | undefined,
  configuredToken: string | undefined,
  nodeEnv = process.env.NODE_ENV
): boolean {
  if (!configuredToken) {
    return nodeEnv !== "production";
  }

  if (!providedToken) {
    return false;
  }

  const provided = Buffer.from(providedToken);
  const configured = Buffer.from(configuredToken);

  if (provided.length !== configured.length) {
    return false;
  }

  return timingSafeEqual(provided, configured);
}

export function tokenFromRequest(request: Request): string | undefined {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-admin-token") ?? undefined;
}
