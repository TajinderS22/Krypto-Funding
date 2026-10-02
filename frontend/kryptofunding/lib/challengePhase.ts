import type { MyChallenge } from "./types";

export type ChallengePhase =
  | "failed"
  | "fully-passed"
  | "stage-passed-awaiting-keys"
  | "live"
  | "no-keys-step1"
  | "unknown";

/** Null-safe key check. Legacy DB rows carry NULL despite the NOT NULL schema. */
export const hasKeys = (
  item: MyChallenge | null | undefined,
): boolean => item?.status?.hasApiKey === true;

export const totalStepsOf = (
  item: MyChallenge | null | undefined,
): number => item?.status?.steps ?? item?.challenge?.steps ?? 1;

export const currentStepOf = (
  item: MyChallenge | null | undefined,
): number => item?.status?.currentStep ?? 1;

/**
 * A previous stage passed and the current stage is running (written by
 * POST /user/api-key when a Stage-N (N>1) key is submitted). Never renders
 * a certificate — only "passed" (full completion) does.
 */
export const isPartiallyPassed = (
  item: MyChallenge | null | undefined,
): boolean => item?.status?.status === "partially_passed";

/**
 * Full-completion gate. ALL conditions required:
 * - status string is terminal "passed"
 * - passed mirror flag true
 * - passedAt timestamp present
 * - pointer reached total (currentStep >= totalSteps)
 * - final-step keys were submitted (hasApiKey === true)
 *
 * The last condition is load-bearing: the balance worker only ever evaluates
 * accounts WITH keys for the current step, and the terminal branch never
 * clears has_api_key. So status=passed + hasApiKey=false/NULL means the final
 * step was never traded (stale/legacy row) and must NOT render a certificate.
 * INVARIANT for backend owners: never set has_api_key=false on a terminal pass.
 */
export function isFullyPassed(
  item: MyChallenge | null | undefined,
): boolean {
  const s = item?.status;
  if (!s || s.status !== "passed") return false;
  if (s.passed !== true) return false;
  if (!s.passedAt) return false;
  if (!hasKeys(item)) return false;
  return currentStepOf(item) >= totalStepsOf(item);
}

export function phaseOf(
  item: MyChallenge | null | undefined,
): ChallengePhase {
  const s = item?.status;
  if (!s) return "unknown";
  if (s.status === "failed") return "failed";
  if (isFullyPassed(item)) return "fully-passed";
  const cur = currentStepOf(item);
  const total = totalStepsOf(item);
  // active (stage 1 / no stage passed yet) and partially_passed (a previous
  // stage passed, current stage running) are both in-progress statuses.
  const inProgress =
    s.status === "active" || s.status === "partially_passed";
  if (hasKeys(item)) return inProgress ? "live" : "unknown";
  if (inProgress && cur <= 1) return "no-keys-step1";
  if (cur > 1 && cur <= total) return "stage-passed-awaiting-keys";
  return "unknown";
}
