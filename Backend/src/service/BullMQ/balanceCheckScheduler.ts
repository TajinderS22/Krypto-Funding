import { Queue, Worker } from "bullmq";
import connection from "./connection.js";
import fetchActiveAccounts from "../../Utils/activeAccounts.js";

export const schedulerQueue = new Queue("challenge-sync-scheduler", { connection });

export const balanceCheckQueue = new Queue("balance-check", { connection });

await schedulerQueue.upsertJobScheduler(
  "create_sync_job_every_10_sec",
  {
    every: 10_000,
  },
  {
    name: "create_job_to_check_balance",
    opts: {
      removeOnComplete: true,
      removeOnFail: {
        age: 60 * 60, 
      },
    },
  }
);

export const schedulerWorker = new Worker(
  "challenge-sync-scheduler",
  async (job) => {
    const activeAccounts = await fetchActiveAccounts();

    await balanceCheckQueue.addBulk(
        activeAccounts.map((account)=>({
            name:`check-balance`,
            data:{account},
            opts:{
                jobId:`check-balance-${account.userId}-${account.purchaseId}`,
                removeOnComplete:true,
                removeOnFail:{age:3600},
            }
        }))
    )
  },
  { connection, concurrency: 1 }
);

schedulerWorker.on("failed", (job, err) => {
  console.error(`[BullMQ] Job ${job?.id} failed:`, err);
});

schedulerWorker.on("error", (err) => {
  console.error("[BullMQ] Worker error:", err);
});