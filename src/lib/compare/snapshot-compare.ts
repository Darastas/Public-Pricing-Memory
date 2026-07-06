import { diffLines } from "diff";
import type { ExtractedPricingPlan } from "../extract/pricing";
import {
  generateChangeEvents,
  type ChangeSeverity,
  type GeneratedChangeEvent,
  type SnapshotForDiff
} from "../diff/pricing-diff";

export type SnapshotForCompare = {
  id: string;
  fetchedAt: Date;
  httpStatus: number | null;
  contentHash: string;
  normalizedText: string;
  pricingPlans: ExtractedPricingPlan[];
};

export type DiffChunk = {
  type: "added" | "removed" | "unchanged";
  text: string;
};

export type SnapshotComparison = {
  from: Pick<SnapshotForCompare, "id" | "fetchedAt" | "httpStatus" | "contentHash">;
  to: Pick<SnapshotForCompare, "id" | "fetchedAt" | "httpStatus" | "contentHash">;
  diffChunks: DiffChunk[];
  changeEvents: GeneratedChangeEvent[];
  summary: {
    addedLines: number;
    removedLines: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
  };
};

export function buildSnapshotCompare(input: {
  from: SnapshotForCompare;
  to: SnapshotForCompare;
}): SnapshotComparison {
  const diffChunks: DiffChunk[] = diffLines(
    input.from.normalizedText,
    input.to.normalizedText
  ).map(
    (part) => ({
      type: part.added ? "added" : part.removed ? "removed" : "unchanged",
      text: part.value
    })
  );
  const changeEvents = generateChangeEvents({
    previous: toDiffSnapshot(input.from),
    current: toDiffSnapshot(input.to)
  });

  return {
    from: snapshotMeta(input.from),
    to: snapshotMeta(input.to),
    diffChunks,
    changeEvents,
    summary: {
      addedLines: countChangedLines(diffChunks, "added"),
      removedLines: countChangedLines(diffChunks, "removed"),
      highSeverityCount: countSeverity(changeEvents, "high"),
      mediumSeverityCount: countSeverity(changeEvents, "medium"),
      lowSeverityCount: countSeverity(changeEvents, "low")
    }
  };
}

function toDiffSnapshot(snapshot: SnapshotForCompare): SnapshotForDiff {
  return {
    id: snapshot.id,
    httpStatus: snapshot.httpStatus,
    contentHash: snapshot.contentHash,
    normalizedText: snapshot.normalizedText,
    plans: snapshot.pricingPlans
  };
}

function snapshotMeta(snapshot: SnapshotForCompare) {
  return {
    id: snapshot.id,
    fetchedAt: snapshot.fetchedAt,
    httpStatus: snapshot.httpStatus,
    contentHash: snapshot.contentHash
  };
}

function countChangedLines(chunks: DiffChunk[], type: DiffChunk["type"]): number {
  return chunks
    .filter((chunk) => chunk.type === type)
    .reduce((total, chunk) => total + chunk.text.split("\n").filter(Boolean).length, 0);
}

function countSeverity(
  events: GeneratedChangeEvent[],
  severity: ChangeSeverity
): number {
  return events.filter((event) => event.severity === severity).length;
}
