// TODO(past-fetch): replace with GET /user/challenges/history/:purchaseId when backend is ready.
import { isFullyPassed } from "./challengePhase";
import type { MyChallenge, PastChallengeDetail } from "./types";

export const STATIC_FAIL_COPY: Record<string, { title: string; body: string }> = {
  DRAWDOWN_BREACH: {
    title: "Max drawdown breached",
    body: "Equity fell below the minimum allowed balance for this evaluation. Trade history is frozen at the last synced balance.",
  },
  RULE_VIOLATION: {
    title: "Rule violation",
    body: "A trading rule was breached during the evaluation window. Details will appear here once the rules engine ships.",
  },
  INACTIVITY: {
    title: "Evaluation expired",
    body: "No trading activity was recorded before the evaluation window closed.",
  },
};

export function getStaticPastDetail(item: MyChallenge): PastChallengeDetail | null {
  if (item.status?.status === "failed") {
    // Prefer the API's failed_reason_code; legacy rows / missing codes fall
    // back to DRAWDOWN_BREACH so a copy entry always exists.
    const code = item.status?.failedReasonCode || "DRAWDOWN_BREACH";
    const copy = STATIC_FAIL_COPY[code] ?? STATIC_FAIL_COPY.DRAWDOWN_BREACH;
    return {
      purchaseId: item.purchase_id,
      challengeId: item.challenge.id,
      outcome: "failed",
      failedReasonCode: code,
      failedReason: item.status?.failedReason || copy?.body,
      breachedValue: item.status?.currentBalance ?? null,
      decidedAt: item.status?.failedAt ?? null,
    };
  }

  // Certificate ONLY for fully-passed (see isFullyPassed: status + flag +
  // fullyPassedAt + pointer + final-step keys). Awaiting-keys rows —
  // including legacy status=passed rows without final keys — return null so
  // no certificate ever renders mid-challenge.
  if (!isFullyPassed(item)) return null;

  return {
    purchaseId: item.purchase_id,
    challengeId: item.challenge.id,
    outcome: "passed",
    certificateId: `KF-${item.purchase_id}-STATIC`,
    decidedAt: item.status?.fullyPassedAt ?? null,
  };
}
