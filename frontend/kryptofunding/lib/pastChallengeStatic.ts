// TODO(past-fetch): replace with GET /user/challenges/history/:purchaseId when backend is ready.
import { isFullyPassed } from "./challengePhase";
import type { MyChallenge, PastChallengeDetail } from "./types";

export const STATIC_FAIL_COPY: Record<string, { title: string; body: string }> = {
  MAX_DRAWDOWN_BREACH: {
    title: "Max drawdown breached",
    body: "Equity fell below the minimum allowed balance for this evaluation. Trade history is frozen at the last synced balance.",
  },
  DAILY_DRAWDOWN_BREACHED: {
    title: "Daily Drawdown breached",
    body: "Wallet Balance fell below the daily minimum balance. The daily balance snapshot is recorded at 12:00 GMT, or 17:30 IST. The minimum balance allowd for a single day is as per given rules or half of max drawdown in percentage terms.",
  },
  MIN_HOLD_TIME: {
    title: "Minimum hold time rule breached.",
    body: "A trade must be held for at least 20 sec to count it a valid trade. Any trade closed within 20 sec of opening breaches this rule. ",
  },
};

export function getStaticPastDetail(item: MyChallenge): PastChallengeDetail | null {
  if (item.status?.status === "failed") {
   
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
