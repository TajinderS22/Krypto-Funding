import clients from "../../Utils/clients.js";

type FreshAccountDataInput = {
  userId: string;
  challengeId: string;
  purchaseId: string;
};

const freshAccountData = async ({
  userId,
  challengeId,
  purchaseId,
}: FreshAccountDataInput) => {
  const client = clients.get(userId);

  console.log(client);

  const orderHistory = await client?.getHistoricOrders({
    category: "linear",
    limit: 50,
  });

  const tradeHistory = await client?.getExecutionList({
    category: "linear",
  });

  const activeOrders = await client?.getActiveOrders({
    category: "linear",
    limit: 50,
    settleCoin: "USDT",
  });

  const closedPositions = await client?.getClosedPnL({
    category: "linear",
  });

  const walletBalance = await client?.getWalletBalance({
    accountType: "UNIFIED",
    coin: "USDT",
  });

  return {
    orderHistory,
    tradeHistory,
    activeOrders,
    closedPositions,
    walletBalance,
  };
};

export default freshAccountData;
