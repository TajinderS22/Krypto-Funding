import { and, eq, inArray } from "drizzle-orm";
import { apiKeys, challenges, challengeStatus, purchases, usersTable } from "../service/Drizzle/db/schema.js";
import db from "../service/Drizzle/index.js";

const fetchActiveAccounts = async () => {
  const users = await db
    .select({
      userId: usersTable.id,
      purchaseId: purchases.id,
      email: usersTable.email,
      firstName: usersTable.firstname,
      lastName: usersTable.lastname,
      currentStep:challengeStatus.current_step,
      challengeStatus,
      challenges,
    })
    .from(usersTable)
    .innerJoin(purchases, eq(purchases.user_id, usersTable.id))
    .innerJoin(
      challengeStatus,
      and(
        eq(challengeStatus.user_id, usersTable.id),
        eq(purchases.id, challengeStatus.purchase_id),
        inArray(challengeStatus.status, ["active", "partially_passed"]),
        eq(challengeStatus.has_api_key, true),
      ),
    )
    .innerJoin(challenges, eq(challenges.id, purchases.challenge_id))
    .innerJoin(
      apiKeys,
      and(
        eq(apiKeys.user_id, usersTable.id),
        eq(apiKeys.purchase_id, purchases.id),
        eq(apiKeys.current_step, challengeStatus.current_step),
      ),
    );

  return users;
};

export default fetchActiveAccounts;