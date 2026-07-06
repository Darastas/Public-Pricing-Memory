import { NextResponse } from "next/server";
import { isAdminAuthorized, tokenFromRequest } from "@/lib/auth/admin-token";
import { createPrismaReextractRepository } from "@/lib/extract/prisma-reextract-repository";
import { reextractSnapshot } from "@/lib/extract/reextract-snapshot";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ snapshotId: string }> }
) {
  if (!isAdminAuthorized(tokenFromRequest(request), process.env.ADMIN_TOKEN)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { snapshotId } = await params;

  try {
    const result = await reextractSnapshot(snapshotId, {
      repository: createPrismaReextractRepository(prisma)
    });

    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Snapshot re-extraction failed";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
