import { Worker } from "bullmq";
import connection from "./connection.js";
import clients, { getClient, getClientKey } from "../../Utils/clients.js";
import {
  apiKeys,
  challengeStatus,
  dailySnapshot,
  exchangeData,
  purchases,
  usersTable,
} from "../Drizzle/db/schema.js";
import db from "../Drizzle/index.js";
import { and, eq, inArray, sql } from "drizzle-orm";
import emailQueue from "./emailService.js";
import redis from "../../Utils/redisClient.js";
import { exit } from "process";

const readList = (data: any | null, key: string): any[] => {
  const result = data?.[key] as any | undefined;
  const nested = result?.result as any | undefined;
  const list = nested?.list;

  return Array.isArray(list) ? (list as any[]) : [];
};

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

      const cachedDataString = await redis.get(
        `realtime-exchange-data-${account.userId}-${account.purchaseId}`,
      );
      //   as Record<string, string | any[]> | null;

      const dailySnapshotDataString = await redis.get(
        `daily-snapshot-${account.userId}-${account.purchaseId}`,
      );
      const dailySnapshot = JSON.parse(dailySnapshotDataString!);
      const dailyDrawdownPercentage =
        account.challenges.daily_drawdown ?? account.challenges.drawdown / 2;
      const dailyDrawdownAmount =
        (dailySnapshot.account_balance * dailyDrawdownPercentage) / 100;
      const minimumDailyBalance =
        dailySnapshot.account_balance - dailyDrawdownAmount;

      const setRealTimeExchangeDataInCache = async () => {
        await redis.set(
          `realtime-exchange-data-${account.userId}-${account.purchaseId}`,
          JSON.stringify(closedPositions),
        );
      };

      // sync exchange data in db and cache if there is any change in trades
      {  if (!cachedDataString) {
          const exist = await db
            .select()
            .from(exchangeData)
            .where(
              and(
                eq(exchangeData.user_id, account.userId),
                eq(exchangeData.purchase_id, account.purchaseId),
                eq(exchangeData.current_step, account.currentStep),
              ),
            );

          console.log(
            "checking exchangeData entry in db if already exited?",
            exist,
          );

          if (!exist) {
            await db.insert(exchangeData).values({
              user_id: account.userId,
              purchase_id: account.purchaseId,
              challenge_id: account.challengeStatus.challenge_id,
              current_step: account.currentStep,
              win_rate: String(winRate),
              profit_factor: String(profitFactor),
              closed_trades: closed,
            });

            await setRealTimeExchangeDataInCache();
          } else {
            await db
              .update(exchangeData)
              .set({
                win_rate: String(winRate),
                profit_factor: String(profitFactor),
                closed_trades: closed,
                updated_at: sql`now()`,
              })
              .where(
                and(
                  eq(exchangeData.user_id, account.userId),
                  eq(exchangeData.purchase_id, account.purchaseId),
                  eq(exchangeData.current_step, account.currentStep),
                ),
              );

            await setRealTimeExchangeDataInCache();
          }
        }

        const cachedData = JSON.parse(cachedDataString!);

        console.log(
          "inside balance action worker checking redis cache for exchange data",
          cachedData,
        );

        const exchangeDataChanged = async (
          cache: Record<string, string | any[]>,
          cloasedTradesExchange: any[],
        ) => {
          const closedTradesFromCache = cache?.closed_trades;
          if (!closedTradesFromCache) return false;

          if (closedTradesFromCache.length !== cloasedTradesExchange?.length)
            return true;

          return false;
        };

        if (await exchangeDataChanged(cachedData!, closed)) {
          const exist = await db
            .select()
            .from(exchangeData)
            .where(
              and(
                eq(exchangeData.user_id, account.userId),
                eq(exchangeData.purchase_id, account.purchaseId),
                eq(exchangeData.current_step, account.currentStep),
              ),
            );

          console.log(
            "checking exchangeData entry in db if already exited?",
            exist,
          );

          if (!exist) {
            await db.insert(exchangeData).values({
              user_id: account.userId,
              purchase_id: account.purchaseId,
              challenge_id: account.challengeStatus.challenge_id,
              current_step: account.currentStep,
              win_rate: String(winRate),
              profit_factor: String(profitFactor),
              closed_trades: closed,
            });

            await setRealTimeExchangeDataInCache();
          } else {
            await db
              .update(exchangeData)
              .set({
                win_rate: String(winRate),
                profit_factor: String(profitFactor),
                closed_trades: closed,
                updated_at: sql`now()`,
              })
              .where(
                and(
                  eq(exchangeData.user_id, account.userId),
                  eq(exchangeData.purchase_id, account.purchaseId),
                  eq(exchangeData.current_step, account.currentStep),
                ),
              );

            await setRealTimeExchangeDataInCache();
          }
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
              message:"Maximum drawdown breached"
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
