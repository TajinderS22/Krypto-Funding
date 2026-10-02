import { RestClientV5 } from "bybit-api";
import { decrypt } from "../service/encryption/decrypt.js";
import type { tryCatch } from "bullmq";

const clients = new Map<string, RestClientV5>();

export function getClientKey(userId: any, purchaseId: any): string {
  return `${userId}-${purchaseId}`;
}

export function syncClients(user: any) {
  const uniqueId = getClientKey(user.userId, user.purchaseId);

  try {
    if (clients.has(uniqueId) || clients.has(user.userId + user.purchaseId)) {
      return clients.get(uniqueId) || clients.get(user.userId + user.purchaseId);
    }

    if (!user.apiKeyCredentials || !user.iv || !user.authTag) {
      throw new Error("Missing API key credentials");
    }

    const cred = JSON.parse(
      decrypt(user.apiKeyCredentials!, user.iv!, user.authTag!)!,
    );
    const client = new RestClientV5({
      key: cred.apiKey,
      secret: cred.apiSecret,
      demoTrading: true,
    });

    clients.set(uniqueId, client);
  } catch (error) {
    console.log(error);
  }

  return;
}

export function getClient(user: any) {
  const uniqueId = getClientKey(user.userId, user.purchaseId);

  try {
    if (clients.has(uniqueId)) return clients.get(uniqueId);
    if (clients.has(user.userId + user.purchaseId)) return clients.get(user.userId + user.purchaseId);

    if (!user.apiKeyCredentials || !user.iv || !user.authTag) {
      throw new Error("Missing API key credentials");
    }

    const cred = JSON.parse(
      decrypt(user.apiKeyCredentials!, user.iv!, user.authTag!)!,
    );
    const client = new RestClientV5({
      key: cred.apiKey,
      secret: cred.apiSecret,
      demoTrading: true,
    });

    clients.set(uniqueId, client);

    return client;
  } catch (error) {
    console.log(error);
  }
}

export default clients;
