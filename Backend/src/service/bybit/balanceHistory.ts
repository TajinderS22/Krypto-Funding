import { and, eq, sql } from "drizzle-orm";
import db from "../Drizzle/index.js";
import {
  challengeStatus,
  challenges,
  exchangeData,
  purchases,
} from "../Drizzle/db/schema.js";
import redis from "../../Utils/redisClient.js";
import {
  balanceHistoryCacheKey,
  getStoredClosedTrades,
  numberValue,
  totalPnl,
  tradePnl,
  tradeTime,
  type ClosedTrade,
} from "./closedPnL.js";

export type BalancePoint = {
  date: number;
  balance: number;
  deviation: number;
};

// Lets the status page render win-rate / P&L / final balance for passed and
// failed challenges straight from exchangeData, with column fallbacks.
export type BalanceMetrics = {
  winRate: number;
  profitFactor: string;
  realizedPnl: number;
  finalBalance: number | null;
};

export type BalanceHistory = {
  startingBalance: number | null;
  startingAt: number | null;
  points: BalancePoint[];
  tradeCount: number;
  downsampled: boolean;
  metrics: BalanceMetrics | null;
};

const MAX_POINTS = 200;
const CACHE_TTL_SECONDS = 60;

export const emptyBalanceHistory = (): BalanceHistory => ({
  startingBalance: null,
  startingAt: null,
  points: [],
  tradeCount: 0,
  downsampled: false,
  metrics: null,
});

// Trades at/after the row's anchor time — drops stage-1 trades that are still
// carried in the shared purchase-level Redis history during stage 2.
export const windowTrades = (
  trades: ClosedTrade[],
  startingAt: number,
): ClosedTrade[] =>
  trades.filter((trade) => {
    const time = tradeTime(trade);
    return time > 0 && time >= startingAt;
  });

// Single ascending pass — O(n), no spread-per-element.
export const buildBalanceCurve = (
  trades: ClosedTrade[],
  startingBalance: number,
  startingAt: number,
): { points: BalancePoint[]; tradeCount: number } => {
  const window = windowTrades(trades, startingAt).sort(
    (a, b) => tradeTime(a) - tradeTime(b),
  );

  const firstWindowTrade = window[0];
  const lastWindowTrade = window[window.length - 1];
  const anchorBase =
    startingAt > 0
        ? startingAt
        : firstWindowTrade
            ? tradeTime(firstWindowTrade)
            : Date.now();
  // A synthetic start that shares its exact millisecond with the first trade
  // renders as a vertical line glued to the y-axis. Lead in by 5% of the
  // window (min 1 min) whenever the anchor would otherwise land on-or-after
  // the first trade, so the curve enters with a visible slope.
  const firstTs = firstWindowTrade ? tradeTime(firstWindowTrade) : 0;
  const lead =
    firstWindowTrade && lastWindowTrade
      ? Math.max(
          Math.floor((tradeTime(lastWindowTrade) - firstTs) * 0.05),
          60_000,
        )
      : 60_000;
  const anchorDate =
    firstWindowTrade && anchorBase >= firstTs - lead
      ? firstTs - lead
      : anchorBase;

  const points: BalancePoint[] = [
    { date: anchorDate, balance: startingBalance, deviation: 0 },
  ];

  let balance = startingBalance;
  for (const trade of window) {
    balance += tradePnl(trade);
    points.push({
      date: tradeTime(trade),
      balance,
      deviation: balance - startingBalance,
    });
  }

  return { points, tradeCount: window.length };
};

// Keeps the extremes (peak equity / max drawdown stay visible) while capping
// the payload the frontend hands to recharts.
export const downsample = (
  points: BalancePoint[],
  max = MAX_POINTS,
): { points: BalancePoint[]; downsampled: boolean } => {
  if (points.length <= max) return { points, downsampled: false };

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const sampled: BalancePoint[] = [first];
  const bucketSize = (points.length - 2) / (max - 2);

  for (let bucket = 0; bucket < max - 2; bucket++) {
    const start = Math.floor(bucket * bucketSize) + 1;
    const end = Math.min(
      Math.max(Math.floor((bucket + 1) * bucketSize) + 1, start + 1),
      points.length - 1,
    );
    const slice = points.slice(start, end);
    if (slice.length === 0) continue;

    let low = slice[0]!;
    let high = slice[0]!;
    for (const point of slice) {
      if (point.balance < low.balance) low = point;
      if (point.balance > high.balance) high = point;
    }
    const [firstInBucket, secondInBucket] =
      low.date <= high.date ? [low, high] : [high, low];
    for (const point of [firstInBucket, secondInBucket]) {
      const tail = sampled[sampled.length - 1];
      if (tail && tail.date !== point.date) sampled.push(point);
    }
  }

  const tail = sampled[sampled.length - 1];
  if (tail && tail.date !== last.date) sampled.push(last);

  return { points: sampled, downsampled: true };
};

// Read-only: ownership + anchor resolution, Redis-cached for 60s and
// invalidated by the balance worker whenever trades or the anchor change.
export const getBalanceHistory = async ({
  userId,
  purchaseId,
  challengeId,
}: {
  userId: number;
  purchaseId: number;
  challengeId?: string | undefined;
}): Promise<BalanceHistory> => {
  const cacheKey = balanceHistoryCacheKey(userId, purchaseId);
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as BalanceHistory;
  } catch (error) {
    console.error("balance history cache read failed", error);
  }

  const [purchase] = await db
    .select()
    .from(purchases)
    .where(
      and(eq(purchases.id, purchaseId), eq(purchases.user_id, userId)),
    )
    .limit(1);
  if (!purchase || (challengeId && purchase.challenge_id !== challengeId)) {
    return emptyBalanceHistory();
  }

  const [status] = await db
    .select()
    .from(challengeStatus)
    .where(
      and(
        eq(challengeStatus.user_id, userId),
        eq(challengeStatus.purchase_id, purchaseId),
      ),
    )
    .orderBy(sql`${challengeStatus.id} desc`)
    .limit(1);
  const step = status?.current_step ?? 1;

  const rows = await db
    .select()
    .from(exchangeData)
    .where(
      and(
        eq(exchangeData.user_id, userId),
        eq(exchangeData.purchase_id, purchaseId),
      ),
    )
    .orderBy(sql`${exchangeData.id} desc`);
  const row = rows.find((candidate) => candidate.current_step === step) ?? rows[0];

  const [challengeRow] = await db
    .select({ value: challenges.value })
    .from(challenges)
    .where(eq(challenges.id, purchase.challenge_id))
    .limit(1);

  const startingAt = numberValue(row?.starting_at) ?? 0;
  const isLiveStatus =
    status?.status === "active" || status?.status === "partially_passed";
  // MAIN LEVEL = challenges.value (the starting balance carried by the
  // my-challenges response). The captured equity anchor and the live initial
  // balance are fallbacks only.
  const startingBalance =
    numberValue(challengeRow?.value) ??
    numberValue(row?.starting_balance) ??
    (isLiveStatus ? numberValue(status?.current_balance) : null);

  if (startingBalance === null) return emptyBalanceHistory();

  const { trades } = await getStoredClosedTrades(userId, purchaseId);
  const { points, tradeCount } = buildBalanceCurve(
    trades,
    startingBalance,
    startingAt,
  );
  const {
    points: finalPoints,
    downsampled,
  } = downsample(points);

  // Metrics over the SAME window as the curve (and as tradeCount).
  const windowed = windowTrades(trades, startingAt);
  const wins = windowed.filter((trade) => tradePnl(trade) > 0).length;
  const grossProfit = windowed.reduce((sum, trade) => {
    const pnl = tradePnl(trade);
    return sum + (pnl > 0 ? pnl : 0);
  }, 0);
  const grossLoss = windowed.reduce((sum, trade) => {
    const pnl = tradePnl(trade);
    return sum + (pnl < 0 ? Math.abs(pnl) : 0);
  }, 0);
  const isTerminal =
    status?.status === "passed" || status?.status === "failed";
  const lastPoint =
    finalPoints.length > 0 ? finalPoints[finalPoints.length - 1] : null;

  const metrics: BalanceMetrics = {
    winRate:
      windowed.length > 0
        ? (wins / windowed.length) * 100
        : Number(row?.win_rate ?? 0) || 0,
    profitFactor:
      windowed.length > 0
        ? grossLoss === 0
          ? "∞"
          : (grossProfit / grossLoss).toFixed(2)
        : row?.profit_factor
            ? String(row.profit_factor)
            : "—",
    realizedPnl: totalPnl(windowed),
    finalBalance:
      (isTerminal ? numberValue(status?.current_balance) : null) ??
      lastPoint?.balance ??
      null,
  };

  const payload: BalanceHistory = {
    startingBalance,
    startingAt,
    points: finalPoints,
    tradeCount,
    downsampled,
    metrics,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(payload), { EX: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error("balance history cache write failed", error);
  }

  return payload;
};
