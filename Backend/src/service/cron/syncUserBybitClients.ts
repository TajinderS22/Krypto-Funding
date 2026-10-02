import cron from "node-cron";
import { apiKeys, challengeStatus, purchases, usersTable } from "../Drizzle/db/schema.js";
import db from "../Drizzle/index.js";
import { and, eq, inArray } from "drizzle-orm";
import { syncClients } from "../../Utils/clients.js";

export const syncUsers = async () => {
  const users = await db
    .select({
      userId: usersTable.id,
      purchaseId: purchases.id,
      apiKeyCredentials: apiKeys.encrypted_api_key_credentials,
      iv: apiKeys.iv,
      authTag: apiKeys.auth_tag,
    })
    .from(usersTable)
    .innerJoin(purchases, eq(purchases.user_id, usersTable.id))
    .innerJoin(
      challengeStatus,
      and(
        eq(challengeStatus.user_id, usersTable.id),
        eq(challengeStatus.purchase_id, purchases.id),
        inArray(challengeStatus.status, ["active", "partially_passed"]),
        eq(challengeStatus.has_api_key, true),
      ),
    )
    .innerJoin(
      apiKeys,
      and(
        eq(apiKeys.user_id, usersTable.id),
        eq(apiKeys.purchase_id, purchases.id),
        eq(apiKeys.current_step, challengeStatus.current_step),
      ),
    );

  users.forEach((user) => {
    syncClients(user);
  });
};

cron.schedule("* * * * *", () => {
  syncUsers();
});
