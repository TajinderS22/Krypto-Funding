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
    return {
      purchaseId: item.purchase_id,
      challengeId: item.challenge.id,
      outcome: "failed",
      failedReasonCode: "DRAWDOWN_BREACH",
      failedReason: STATIC_FAIL_COPY.DRAWDOWN_BREACH.body,
      breachedValue: item.status?.currentBalance ?? null,
      decidedAt: item.status?.failedAt ?? null,
    };
  }

  // Certificate ONLY for fully-passed (see isFullyPassed: status + flag +
  // passedAt + pointer + final-step keys). Awaiting-keys rows — including
  // legacy status=passed rows without final keys — return null so no
  // certificate ever renders mid-challenge.
  if (!isFullyPassed(item)) return null;

  return {
    purchaseId: item.purchase_id,
    challengeId: item.challenge.id,
    outcome: "passed",
    certificateId: `KF-${item.purchase_id}-STATIC`,
    decidedAt: item.status?.passedAt ?? null,
  };
}
