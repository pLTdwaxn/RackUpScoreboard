import type { FrameLogEntry } from "@/types";

export function isUnresolvedSummaryBreakEntry(entry: FrameLogEntry): boolean {
  return Boolean(
    entry.shots?.some(
      (shot) =>
        shot.action === "log_break" && shot.composition_status === "missing",
    ) ||
      entry.facts.some(
        (fact) =>
          fact.kind === "summary_break" &&
          fact.composition_status === "missing",
      ),
  );
}

export function isSyntheticEntry(entry: FrameLogEntry): boolean {
  const factKind = entry.facts[0]?.kind;
  return factKind === "break_off" || factKind === "turn_started";
}
