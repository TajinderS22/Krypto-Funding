import { Queue, Worker } from "bullmq";
import sendChallengePassedEmail from "../email/sendChallengePassedEmail.js";

import connection from "./connection.js";
import sendChallengeFailedEMail from "../email/sendChallengeFailedEmail.js";

const emailQueue = new Queue("email", {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 3600 },
  },
});

const emailHandlers = {
  "challenge-passed": sendChallengePassedEmail,
  "challenge-failed": sendChallengeFailedEMail,
};

new Worker(
  "email",
  async (job) => {
    const handler = emailHandlers[job.name as keyof typeof emailHandlers];

    if (!handler) {
      throw new Error(`Unknown email job: ${job.name}`);
    }
    console.log("sending email to user from mail queue");
    console.log(job.data);
    await handler(job.data);
  },
  {
    connection,
    concurrency: 10,
    removeOnComplete: { age: 60},
    removeOnFail: { age: 3600 },
  }
);

export default emailQueue;
