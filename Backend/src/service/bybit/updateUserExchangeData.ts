// import { getClient } from "../../Utils/clients.js";
// import type { UserType } from "../../validation/userSchema.js";
// import emailQueue from "../BullMQ/emailService.js";
// import {
//   apiKeys,
//   challenges,
//   challengeStatus,
//   purchases,
//   usersTable,
// } from "../Drizzle/db/schema.js";
// import db from "../Drizzle/index.js";
// import { and, eq, ne, not, sql } from "drizzle-orm";

// const syncData = async () => {
//   const users = await db
//     .select({
//       userId: usersTable.id,
//       purchaseId: purchases.id,
//       apiKeyCredentials: apiKeys.encrypted_api_key_credentials,
//       iv: apiKeys.iv,
//       authTag: apiKeys.auth_tag,
//       email: usersTable.email,
//       firstName:usersTable.firstname,
//       lastName:usersTable.lastname,
//       challengeStatus,
//       challenges,
//     })
//     .from(usersTable)
//     .innerJoin(purchases, eq(purchases.user_id, usersTable.id))
//     .innerJoin(
//       challengeStatus,
//       and(
//         eq(challengeStatus.user_id, usersTable.id),
//         eq(purchases.id, challengeStatus.purchase_id),
//         eq(challengeStatus.status, "active"),
//       ),
//     )
//     .innerJoin(challenges, eq(challenges.id, purchases.challenge_id))
//     .innerJoin(
//       apiKeys,
//       and(
//         eq(apiKeys.user_id, usersTable.id),
//         eq(apiKeys.purchase_id, purchases.id),
//       ),
//     );

//   await Promise.all(
//     users.map(async (user) => {
//       try {
//         const client = getClient(user);
//         const bal = await client?.getWalletBalance({
//           accountType: "UNIFIED",
//           coin: "USDT",
//         });

//         const accountBalance = bal?.result.list[0]?.totalMarginBalance;
//         const actionAmount =
//           (user.challenges?.value! * user.challenges?.drawdown!) / 100;
//         const accountValue = user.challenges?.value;
//         const minBalance = accountValue! - actionAmount;
//         const targetBalance = accountValue! + actionAmount;

//         if (
//           !accountBalance ||
//           accountValue == null ||
//           !user.challengeStatus?.id ||
//           user.userId == null ||
//           user.purchaseId == null
//         )
//           return;

//         if (Number(accountBalance) > targetBalance) {
//           await db
//             .update(challengeStatus)
//             .set({
//               status: "passed",
//               current_balance: String(accountBalance),
//               passed: true,
//               failed: false,
//               passed_at: sql`now()`,
//               updated_at: sql` now()`,
//             })
//             .where(
//               and(
//                 eq(challengeStatus.user_id, user.userId),
//                 eq(challengeStatus.purchase_id, user.purchaseId),
//                 eq(challengeStatus.status, "active"),
//               ),
//             );

//           // learn queing system to send pass 
            
          

//         }

//         if (Number(accountBalance) < minBalance) {
//           await db
//             .update(challengeStatus)
//             .set({
//               status: "failed",
//               current_balance: String(accountBalance),
//               failed: true,
//               passed: false,
//               failed_at: sql`now()`,
//               updated_at: sql` now()`,
//             })
//             .where(
//               and(
//                 eq(challengeStatus.user_id, user.userId),
//                 eq(challengeStatus.purchase_id, user.purchaseId),
//               ),
//             );
//           // add 'send challenge failed Email' here
//           await emailQueue.add(
//             "challenge-failed",
//             {
//               userId: user.userId,
//               email: user.email,
//               challengeId: user.challengeStatus.challenge_id,
//               firstName: user.firstName,
//               lastName: user.lastName,
//               challengeName: user.challenges.title,
//               purchaseId: user.purchaseId,
//               accountBalance: accountBalance,
//             },
//             {
//               attempts: 5,
//               backoff: {
//                 type: "exponential",
//                 delay: 5000,
//               },
//             },
//           );
//         }
//         console.log("allDOne");
//       } catch (error) {
//         console.log(error);
//       }
//     }),
//   );
// };

// syncData();
