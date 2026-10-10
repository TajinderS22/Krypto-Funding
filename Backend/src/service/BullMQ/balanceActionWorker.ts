import { Worker } from "bullmq";
import connection from "./connection.js";
import clients, { getClient, getClientKey } from "../../Utils/clients.js";
import {
  apiKeys,
  challengeStatus,
  dailySnapshot,
  exchangeData,
  passCertificate,
  purchases,
  usersTable,
} from "../Drizzle/db/schema.js";
import db from "../Drizzle/index.js";
import { and, eq, inArray, sql } from "drizzle-orm";
import emailQueue from "./emailService.js";
import redis from "../../Utils/redisClient.js";
import { exit } from "process";
import { triggerDailySnapshot } from "./dailySnapshot.js";
import {
  balanceHistoryCacheKey,
  fetchClosedPnLPage,
  loadClosedTradesFromDb,
  mergeClosedTrades,
  numberValue,
  realtimeExchangeKey,
  totalPnl,
  tradeTime,
  type ClosedTrade,
} from "../bybit/closedPnL.js";

// Rows in either in-progress status can still transition (stage-advance,
// terminal pass, fail). "partially_passed" = a previous stage passed and the
// current stage is running with keys submitted.
const IN_PROGRESS_STATUSES = ["active", "partially_passed"] as const;

new Worker(
  "balance-check",
  async (job) => {
    try {
      const { account } = job.data;
      const client = getClient(account);
      const bal = await client?.getWalletBalance({
        accountType: "UNIFIED",
        coin: "USDT",
      });
      const accountBalance = bal?.result.list[0]?.totalMarginBalance;
      const walletCoins = bal?.result.list[0]?.coin ?? [];
      const usdtCoin =
        walletCoins.find((coin: any) => coin.coin === "USDT") ?? walletCoins[0];
      // Same equity field the frontend chart anchors on.
      const equityNow =
        numberValue(usdtCoin?.equity) ?? numberValue(accountBalance);
      const drawdownAmount =
        (account.challenges?.value * account.challenges?.drawdown) / 100;
      const accountVlaue = account.challenges?.value;
      const targetAmount =
        (account.challenges?.value * account.challenges.target) / 100;
      const minBalance = accountVlaue - drawdownAmount;
      const targetBalance = accountVlaue + targetAmount;

      // Full merged history: ONE fresh Bybit page (limit 100 instead of the
      // default 50) unioned with whatever Redis/Postgres already accumulated.
      // Same API budget as before — history grows trade-by-trade over cycles.
      const historyKey = realtimeExchangeKey(account.userId, account.purchaseId);
      const cachedDataString = await redis.get(historyKey);
      const cacheMissing =
        cachedDataString === null || cachedDataString === undefined;
      const stored: ClosedTrade[] = cacheMissing
        ? await loadClosedTradesFromDb(account.userId, account.purchaseId)
        : JSON.parse(cachedDataString) || [];
      const freshPage = (await fetchClosedPnLPage(client)) ?? [];
      const closed = mergeClosedTrades(stored, freshPage);

      const wins = closed.reduce(
        (count, item) => count + (Number(item.closedPnl) > 0 ? 1 : 0),
        0,
      );
      const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;

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

      const dailySnapshotDataString = await redis.get(
        `daily-snapshot-${account.userId}-${account.purchaseId}`,
      );

      if (!dailySnapshotDataString) {
        await triggerDailySnapshot(
          account,
          accountBalance,
          String(winRate),
          profitFactor,
          closed,
        );
      }

      const dailySnapshot = JSON.parse(dailySnapshotDataString!);
      const dailyDrawdownPercentage =
        account.challenges.daily_drawdown ?? account.challenges.drawdown / 2;
      const dailyDrawdownAmount =
        (dailySnapshot.account_balance * dailyDrawdownPercentage) / 100;
      const minimumDailyBalance =
        dailySnapshot.account_balance - dailyDrawdownAmount;

      const exchangeDataChanged = (
        cachedTrades: ClosedTrade[],
        closedTradesExchange: ClosedTrade[],
      ): boolean => {
        if (cachedTrades.length !== closedTradesExchange.length) {
          return true;
        }

        if (closedTradesExchange.length === 0) {
          return false;
        }

        const cachedLatest = cachedTrades[0];
        const exchangeLatest = closedTradesExchange[0];
        if (!cachedLatest || !exchangeLatest) {
          return true;
        }

        return (
          cachedLatest.orderId !== exchangeLatest.orderId ||
          cachedLatest.updatedTime !== exchangeLatest.updatedTime ||
          cachedLatest.closedPnl !== exchangeLatest.closedPnl
        );
      };

      const changed = cacheMissing || exchangeDataChanged(stored, closed);

      const existingRows = await db
        .select({
          id: exchangeData.id,
          starting_balance: exchangeData.starting_balance,
          starting_at: exchangeData.starting_at,
        })
        .from(exchangeData)
        .where(
          and(
            eq(exchangeData.user_id, account.userId),
            eq(exchangeData.purchase_id, account.purchaseId),
            eq(exchangeData.current_step, account.currentStep),
          ),
        );
      const row = existingRows[0];

      // Anchor the balance curve exactly once per row (capture-once):
      // - existing row without an anchor (legacy): back-solve from the full
      //   merged history so past trades stay on the curve;
      // - brand-new stage > 1: anchor at current equity and ignore trades
      //   carried over from the previous stage;
      // - no trades yet: anchor at current equity, curve starts flat.
      let capturedAnchor: { balance: number; at: number } | null = null;
      if (numberValue(row?.starting_balance) === null && equityNow !== null) {
        const carriedOverStage = !row && account.currentStep > 1;
        if (!carriedOverStage && closed.length > 0) {
          const times = closed.map(tradeTime).filter((time) => time > 0);
          capturedAnchor = {
            balance: equityNow - totalPnl(closed),
            at: times.length > 0 ? Math.min(...times) : 0,
          };
        } else {
          capturedAnchor = { balance: equityNow, at: Date.now() };
        }
      }

      if (!row) {
        await db.insert(exchangeData).values({
          user_id: account.userId,
          purchase_id: account.purchaseId,
          challenge_id: account.challengeStatus.challenge_id,
          current_step: account.currentStep,
          win_rate: String(winRate),
          profit_factor: String(profitFactor),
          closed_trades: closed,
          ...(capturedAnchor
            ? {
                starting_balance: String(capturedAnchor.balance),
                starting_at: capturedAnchor.at,
              }
            : {}),
        });
      } else if (changed || capturedAnchor) {
        await db
          .update(exchangeData)
          .set({
            ...(changed
              ? {
                  win_rate: String(winRate),
                  profit_factor: String(profitFactor),
                  closed_trades: closed,
                }
              : {}),
            ...(capturedAnchor
              ? {
                  starting_balance: String(capturedAnchor.balance),
                  starting_at: capturedAnchor.at,
                }
              : {}),
            updated_at: sql`now()`,
          })
          .where(eq(exchangeData.id, row.id));
      }

      if (changed) {
        await redis.set(historyKey, JSON.stringify(closed));
      }
      if (changed || capturedAnchor) {
        try {
          await redis.del(
            balanceHistoryCacheKey(account.userId, account.purchaseId),
          );
        } catch (cacheError) {
          console.error("balance history cache invalidation failed", cacheError);
        }
      }

      if (!accountBalance || accountVlaue == null) return;

      //  passed condition check
      if (Number(accountBalance) > targetBalance) {
        const totalSteps =
          account.challengeStatus.steps ?? account.challenges?.steps ?? 1;
        const currentStep = account.challengeStatus.current_step ?? 1;

        await db
          .delete(apiKeys)
          .where(
            and(
              eq(apiKeys.user_id, account.userId),
              eq(apiKeys.purchase_id, account.purchaseId),
            ),
          );

        clients.delete(getClientKey(account.userId, account.purchaseId));
        clients.delete(`${account.userId}${account.purchaseId}`);

        if (totalSteps > 1) {
          if (currentStep < totalSteps) {
            const result = await db
              .update(challengeStatus)
              .set({
                current_step: currentStep + 1,
                has_api_key: false,
                current_balance: String(
                  account.challenges?.value ?? accountBalance,
                ),
                passed_step_1: true,
                passed_step_1_at: sql`now()`,
                updated_at: sql`now()`,
                status: "partially_passed",
              })
              .where(
                and(
                  eq(challengeStatus.user_id, account.userId),
                  eq(challengeStatus.purchase_id, account.purchaseId),
                  inArray(challengeStatus.status, IN_PROGRESS_STATUSES),
                ),
              )
              .returning({
                id: challengeStatus.id,
              });

            if (result.length > 0) {
              await emailQueue.add(
                "challenge-passed",
                {
                  userId: account.userId,
                  email: account.email,
                  challengeId: account.challengeStatus.challenge_id,
                  firstName: account.firstName,
                  lastName: account.lastName,
                  challengeName: account.challenges.title,
                  purchaseId: account.purchaseId,
                  accountBalance: accountBalance,
                  message: "passed the stage 1 ",
                  currentStage: currentStep,
                  totalSteps: totalSteps,
                },
                {
                  attempts: 5,
                  backoff: {
                    type: "exponential",
                    delay: 5000,
                  },
                },
              );
            }
          } else {
            const [cert] = await db
              .insert(passCertificate)
              .values({
                user_id: account.userId,
                purchase_id: account.purchaseId,
                updated_at: sql`now()`,
              })
              .returning();

            const result = await db
              .update(challengeStatus)
              .set({
                has_api_key: false,
                current_balance: String(
                  account.challenges?.value ?? accountBalance,
                ),
                passed_step_2: true,
                passed_step_2_at: sql`now()`,
                updated_at: sql`now()`,
                fully_passed: true,
                fully_passed_at: sql`now()`,
                status: "passed",
                certificate_id: cert?.id,
              })
              .where(
                and(
                  eq(challengeStatus.user_id, account.userId),
                  eq(challengeStatus.purchase_id, account.purchaseId),
                  inArray(challengeStatus.status, IN_PROGRESS_STATUSES),
                ),
              )
              .returning({
                id: challengeStatus.id,
              });

            if (result.length > 0) {
              await emailQueue.add(
                "challenge-passed",
                {
                  userId: account.userId,
                  email: account.email,
                  challengeId: account.challengeStatus.challenge_id,
                  firstName: account.firstName,
                  lastName: account.lastName,
                  challengeName: account.challenges.title,
                  purchaseId: account.purchaseId,
                  accountBalance: accountBalance,
                  message: "congratulations you passed all the stages",
                  currentStage: currentStep,
                  totalSteps: totalSteps,
                },
                {
                  attempts: 5,
                  backoff: {
                    type: "exponential",
                    delay: 5000,
                  },
                },
              );
            }
          }
        } else {
          const result = await db
            .update(challengeStatus)
            .set({
              status: "passed",
              current_balance: String(accountBalance),
              fully_passed: true,
              failed: false,
              passed_step_1_at: sql`now()`,
              fully_passed_at: sql`now()`,
              updated_at: sql`now()`,
            })
            .where(
              and(
                eq(challengeStatus.user_id, account.userId),
                eq(challengeStatus.purchase_id, account.purchaseId),
                inArray(challengeStatus.status, IN_PROGRESS_STATUSES),
              ),
            )
            .returning({
              id: challengeStatus.id,
            });

          if (result.length > 0) {
            await emailQueue.add(
              "challenge-passed",
              {
                userId: account.userId,
                email: account.email,
                challengeId: account.challengeStatus.challenge_id,
                firstName: account.firstName,
                lastName: account.lastName,
                challengeName: account.challenges.title,
                purchaseId: account.purchaseId,
                accountBalance: accountBalance,
              },
              {
                attempts: 5,
                backoff: {
                  type: "exponential",
                  delay: 5000,
                },
              },
            );
          }
        }
      }

      // failed condition check
      if (Number(accountBalance) < minBalance) {
        await db
          .delete(apiKeys)
          .where(
            and(
              eq(apiKeys.user_id, account.userId),
              eq(apiKeys.purchase_id, account.purchaseId),
            ),
          );

        clients.delete(getClientKey(account.userId, account.purchaseId));
        clients.delete(`${account.userId}${account.purchaseId}`);

        const result = await db
          .update(challengeStatus)
          .set({
            status: "failed",
            current_balance: String(accountBalance),
            failed: true,
            fully_passed: false,
            failed_at: sql`now()`,
            updated_at: sql`now()`,
          })
          .where(
            and(
              eq(challengeStatus.user_id, account.userId),
              eq(challengeStatus.purchase_id, account.purchaseId),
              inArray(challengeStatus.status, IN_PROGRESS_STATUSES),
            ),
          )
          .returning({
            id: challengeStatus.id,
          });

        if (result.length > 0) {
          await emailQueue.add(
            "challenge-failed",
            {
              userId: account.userId,
              email: account.email,
              challengeId: account.challengeStatus.challenge_id,
              firstName: account.firstName,
              lastName: account.lastName,
              challengeName: account.challenges.title,
              purchaseId: account.purchaseId,
              accountBalance: accountBalance,
              failureReason: " Breached maximum drawdown limit ",
              message: "Maximum drawdown breached",
            },
            {
              attempts: 5,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
            },
          );
        }
      }

      //  check for daily drawdown
      if (Number(accountBalance) < minimumDailyBalance) {
        await db
          .delete(apiKeys)
          .where(
            and(
              eq(apiKeys.user_id, account.userId),
              eq(apiKeys.purchase_id, account.purchaseId),
            ),
          );

        clients.delete(getClientKey(account.userId, account.purchaseId));
        clients.delete(`${account.userId}${account.purchaseId}`);

        const result = await db
          .update(challengeStatus)
          .set({
            status: "failed",
            current_balance: String(accountBalance),
            failed: true,
            fully_passed: false,
            failed_at: sql`now()`,
            updated_at: sql`now()`,
            failed_reason_code: "BREACHED_DAILY_DRAWDOWN_LIMIT",
          })
          .where(
            and(
              eq(challengeStatus.user_id, account.userId),
              eq(challengeStatus.purchase_id, account.purchaseId),
              inArray(challengeStatus.status, IN_PROGRESS_STATUSES),
            ),
          )
          .returning({
            id: challengeStatus.id,
          });

        if (result.length > 0) {
          await emailQueue.add(
            "challenge-failed",
            {
              userId: account.userId,
              email: account.email,
              challengeId: account.challengeStatus.challenge_id,
              firstName: account.firstName,
              lastName: account.lastName,
              challengeName: account.challenges.title,
              purchaseId: account.purchaseId,
              accountBalance: accountBalance,
              FailureReason: "Daily drawdown limit breached.",
              message: "Daily drawdown limit breached.",
            },
            {
              attempts: 5,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
            },
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  },
  {
    connection,
    concurrency: 30,
    limiter: {
      max: Number(process.env.BYBIT_QUEUE_RATE_PER_SEC ?? 300),
      duration: 1000,
    },
  },
);
