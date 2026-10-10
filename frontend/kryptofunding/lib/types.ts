export type Challenge = {
  id: string;
  creator_id?: string;
  title: string;
  description: string;
  value: number;
  price: number;
  steps?: number | null;
  drawdown?: number | null;
  // Daily drawdown casing depends on the endpoint: raw selects
  // (GET /user/challenges, GET /admin/challenges) return snake_case
  // `daily_drawdown`, while my-challenges aliases it to `dailyDrawdown`.
  // Read as `dailyDrawdown ?? daily_drawdown`.
  daily_drawdown?: number | null;
  dailyDrawdown?: number | null;
  target?: number | null;
  created_at: Date;
  updated_at: Date;
};

export type ChallengeStatus = {
  id: number;
  // Lifecycle: "active" (stage 1 / no stage passed yet) |
  // "partially_passed" (a previous stage passed, current stage running with
  // keys) | "passed" (FULL completion — only this may render the
  // certificate) | "failed".
  status: string;
  // Terminal mirrors written by the balance worker. `passed`/`passed_at`
  // were dropped from the schema (renamed to passed_step_1 / passed_step_1_at)
  // and are no longer sent by the API — use the fields below instead.
  fullyPassed?: boolean | null;
  passedStep1?: boolean | null;
  passedStep2?: boolean | null;
  failed: boolean;
  currentStep: number | null;
  steps: number | null;
  // NOTE: legacy rows in DB carry NULL here despite the NOT NULL schema.
  // Always normalize via hasKeys() in lib/challengePhase.ts (=== true check),
  // never rely on truthiness or === false.
  hasApiKey: boolean | null | undefined;
  value: number;
  currentBalance: number;
  fullyPassedAt?: string | null;
  passedStep1At?: string | null;
  passedStep2At?: string | null;
  failedAt?: string | null;
  failedReasonCode?: string | null;
  failedReason?: string | null;
  updated_at: string;
};

export type MyChallenge = {
  purchase_id: number;
  purchase_date: string;
  status: ChallengeStatus | null;
  challenge: Challenge;
};

// TODO(past-fetch): shape of the future GET /user/challenges/history/:purchaseId.
// For now everything is derived from MyChallenge + static maps.
export type PastChallengeDetail = {
  purchaseId: number;
  challengeId: string;
  outcome: "passed" | "failed";
  failedReasonCode?:
    | string
    | "DRAWDOWN_BREACH"
    | "RULE_VIOLATION"
    | "INACTIVITY";
  failedReason?: string;
  breachedValue?: number | null;
  certificateId?: string;
  decidedAt?: string | null;
};
