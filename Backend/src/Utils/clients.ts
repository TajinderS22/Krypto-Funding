// import type { RestClientV5 } from "bybit-api";
import { RestClientV5 } from "bybit-api";
import { decrypt } from "../service/encryption/decrypt.js";

const clients = new Map<string, RestClientV5>();

export function syncClients(user: any) {
  if (clients.has(user.userId)) return clients.get(user.userId);

  const cred = JSON.parse(
    decrypt(user.apiKeyCredentials, user.iv, user.authTag),
  );
  const client = new RestClientV5({
    key: cred.apiKey,
    secret: cred.apiSecret,
    demoTrading: true,
  });

  clients.set(user.userId, client);

  return;
}

export default clients;
