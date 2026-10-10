import { and, eq, sql } from "drizzle-orm";
import db from "../Drizzle/index.js";
import { exchangeData } from "../Drizzle/db/schema.js";
import redis from "../../Utils/redisClient.js";

export type ClosedTrade = Record<string, any>;

const PAGE_LIMIT = 100;
const MAX_HISTORY = 5000;

export const numberValue = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const tradeTime = (trade: ClosedTrade): number =>
  numberValue(trade.updatedTime) ??
  numberValue(trade.execTime) ??
  numberValue(trade.createdTime) ??
  0;

export const tradePnl = (trade: ClosedTrade): number =>
  numberValue(trade.closedPnl) ?? numberValue(trade.execPnl) ?? 0;

export const totalPnl = (trades: ClosedTrade[]): number =>
  trades.reduce((sum, trade) => sum + tradePnl(trade), 0);

const tradeKey = (trade: ClosedTrade): string =>
  [
    trade.tradeId ?? trade.orderId ?? "",
    trade.symbol ?? "",
    trade.updatedTime ?? "",
    trade.closedPnl ?? "",
  ].join("|");

export const realtimeExchangeKey = (userId: number, purchaseId: number) =>
  `realtime-exchange-data-${userId}-${purchaseId}`;

export const balanceHistoryCacheKey = (userId: number, purchaseId: number) =>
  `balance-history-${userId}-${purchaseId}`;

// Newest-first, deduped by trade identity, capped so a single account can
// never balloon a Redis string or a jsonb column unboundedly.
export const mergeClosedTrades = (
  ...lists: ClosedTrade[][]
): ClosedTrade[] => {
  const byKey = new Map<string, ClosedTrade>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const trade of list) {
      const key = tradeKey(trade);
      if (!byKey.has(key)) byKey.set(key, trade);
    }
  }
  return [...byKey.values()]
    .sort((a, b) => tradeTime(b) - tradeTime(a))
    .slice(0, MAX_HISTORY);
};

// One Bybit call — same cost as the old code, but limit 100 instead of
// Bybit's default 50 so each poll contributes twice as much history.
export const fetchClosedPnLPage = async (
  client: any,
): Promise<ClosedTrade[] | null> => {
  try {
    const response = await client?.getClosedPnL({
      category: "linear",
      limit: PAGE_LIMIT,
    });
    const list = response?.result?.list;
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.error("getClosedPnL failed", error);
    return null;
  }
};

export const loadClosedTradesFromDb = async (
  userId: number,
  purchaseId: number,
): Promise<ClosedTrade[]> => {
  const rows = await db
    .select({ closed_trades: exchangeData.closed_trades })
    .from(exchangeData)
    .where(
      and(
        eq(exchangeData.user_id, userId),
        eq(exchangeData.purchase_id, purchaseId),
      ),
    )
    .orderBy(sql`${exchangeData.id} desc`)
    .limit(1);
  const trades = rows[0]?.closed_trades;
  return Array.isArray(trades) ? (trades as ClosedTrade[]) : [];
};

// Redis first (worker keeps it warm every 10s), Postgres as fallback.
export const getStoredClosedTrades = async (
  userId: number,
  purchaseId: number,
): Promise<{ trades: ClosedTrade[]; exists: boolean }> => {
  try {
    const cached = await redis.get(realtimeExchangeKey(userId, purchaseId));
    if (cached !== null && cached !== undefined) {
      const parsed = JSON.parse(cached);
      return { trades: Array.isArray(parsed) ? parsed : [], exists: true };
    }
  } catch (error) {
    console.error("realtime exchange cache read failed", error);
  }
  const trades = await loadClosedTradesFromDb(userId, purchaseId);
  return { trades, exists: trades.length > 0 };
};

// Single entry point for "give me the fullest closed-trade history cheaply":
// one fresh Bybit page (1 API call, same budget as the old code) merged into
// whatever history Redis/Postgres already accumulated. History therefore grows
// trade-by-trade over time without ever paging through the exchange.
export const getMergedClosedPnL = async ({
  userId,
  purchaseId,
  client,
}: {
  userId: number;
  purchaseId: number;
  client: any;
}): Promise<{
  trades: ClosedTrade[];
  stored: ClosedTrade[];
  storedExists: boolean;
}> => {
  const { trades: stored, exists: storedExists } = await getStoredClosedTrades(
    userId,
    purchaseId,
  );

  const freshPage = await fetchClosedPnLPage(client);
  if (!freshPage) return { trades: stored, stored, storedExists };

  return {
    trades: mergeClosedTrades(stored, freshPage),
    stored,
    storedExists,
  };
};
