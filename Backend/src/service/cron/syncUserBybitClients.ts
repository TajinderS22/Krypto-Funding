import cron from "node-cron";
import { apiKeys, purchases, usersTable } from "../Drizzle/db/schema.js";
import db from "../Drizzle/index.js";
import { and, eq } from "drizzle-orm";
import { syncClients } from "../../Utils/clients.js";

const syncUsers = async () => {
  const users = await db
    .select({
      userId: usersTable.id,
      purchaseId: purchases.id,
      apiKeyCredentials: apiKeys.encrypted_api_key_credentials,
      iv: apiKeys.iv,
      authTag: apiKeys.auth_tag,
    })
    .from(usersTable)
    .rightJoin(apiKeys, eq(usersTable.id, apiKeys.user_id))
    .innerJoin(purchases, and(eq(purchases.user_id, usersTable.id),eq(purchases.id, apiKeys.pruchase_id),));

  console.log(users);

  users.map((user) => {
    syncClients(user);
  });
};

cron.schedule("* * * * *", () => {
  syncUsers();
});
