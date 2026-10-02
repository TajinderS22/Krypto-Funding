import { Queue, Worker } from "bullmq";
import connection from "./connection.js";
import fetchActiveAccounts from "../../Utils/activeAccounts.js";
import { getClient } from "../../Utils/clients.js";
import db from "../Drizzle/index.js";
import { dailySnapshot, exchangeData } from "../Drizzle/db/schema.js";
import { and, eq, sql } from "drizzle-orm";
import redis from "../../Utils/redisClient.js";

// ****************************************************************************
// this file contains code to create snap shot and also setting the values to
// redis for easy constant access and avoid unnecessary db calls
// *****************************************************************************

const dailySnapshotQueueScheduler = new Queue("daily-snapshot-jobs-scheduler", {
  connection: connection,
});
const dailySnapshotQueue = new Queue("daily-snapshot-queue", {
  connection: connection,
});

await dailySnapshotQueueScheduler.upsertJobScheduler(
  "daily-exchange-data-snapshot",
  {
    pattern: "0 0 12 * * *",
  },
  {
    name: "daily-snapshot-scheduler",
    opts: {
      removeOnComplete: true,
      removeOnFail: { age: 3600 },
    },
  },
);

const dailySnapshotSchedulerWorker = new Worker(
  "daily-snapshot-jobs-scheduler",
  async (job) => {
    const activeAccounts = await fetchActiveAccounts();

    await dailySnapshotQueue.addBulk(
      activeAccounts.map((account) => ({
        name: `daily-snapshot`,
        data: { account },
        opts: {
          jobId: `daily-snapshot-${account.userId}-${account.purchaseId}`,
          removeOnComplete: true,
          removeOnFail: { age: 3600 },
        },
      })),
    );
  },
  {
    connection: connection,
    concurrency: 1,
  },
);

dailySnapshotSchedulerWorker.on("failed", (job, err) => {
  console.error(`[BullMQ] Job ${job?.id} failed:`, err);
});

dailySnapshotSchedulerWorker.on("error", (err) => {
  console.error("[BullMQ] Worker error:", err);
});

const readList = (data: any | null, key: string): any[] => {
  const result = data?.[key] as any | undefined;
  const nested = result?.result as any | undefined;
  const list = nested?.list;
  return Array.isArray(list) ? (list as any[]) : [];
};

new Worker("daily-snapshot", async (job) => {
  const { account } = job.data;

  const client = getClient(account);

  const bal = await client?.getWalletBalance({
    accountType: "UNIFIED",
    coin: "USDT",
  });

  const accountBalance = bal?.result.list[0]?.totalMarginBalance;
  const drawdownAmount =
    (account.challenges?.value * account.challenges?.drawdown) / 100;
  const accountVlaue = account.challenges?.value;
  const targetAmount =
    (account.challenges?.value * account.challenges.target) / 100;

  const minBalance = accountVlaue - drawdownAmount;
  const targetBalance = accountVlaue + targetAmount;

  const closedPositions = await client?.getClosedPnL({
    category: "linear",
  });

  const closed = readList(closedPositions, "closedPositions");
  const wins = closed.reduce(
    (count, item) => count + (Number(item.closedPnl) > 0 ? 1 : 0),
    0,
  );
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

  const numberValue = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const grossLoss = closed.reduce((sum, item) => {
    const pnl = numberValue(item.closedPnl) ?? 0;
    return sum + (pnl < 0 ? Math.abs(pnl) : 0);
  }, 0);

  const grossProfit = closed.reduce((sum, item) => {
    const pnl = numberValue(item.closedPnl) ?? 0;
    return sum + (pnl > 0 ? pnl : 0);
  }, 0);

  const profitFactor =
    grossLoss == 0 ? "∞" : (grossProfit / grossLoss).toFixed(2);

  try {

    const exist = await db.select()
                    .from(exchangeData)
                    .where(and(
                        eq(exchangeData.user_id,account.userId),
                        eq(exchangeData.purchase_id,account.purchaseId),
                        eq(exchangeData.current_step,account.currentStep)
                    ))
    const res = await db
      .update(dailySnapshot)
      .set({
        account_balance: accountBalance,
        win_rate: String(winRate),
        profit_factor: String(profitFactor),
        closed_trades: closed,
        updated_at: sql`now()`,
      })
      .returning();

    const snapShot = res[0];

    await redis.set(
      `daily-snapshot-${account.userId}-${account.purchaseId}`,
      JSON.stringify(snapShot),
      { EX: 86600 },
    );
  } catch (error) {
    console.log(error);
  }
});
