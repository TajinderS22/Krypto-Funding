import clients, { getClientKey } from "../../Utils/clients.js";
import { getMergedClosedPnL } from "./closedPnL.js";

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
  try {
    const client = clients.get(getClientKey(Number(userId), Number(purchaseId))) || clients.get(userId + purchaseId);

    // const orderHistory = await client?.getHistoricOrders({
    //   category: "linear",
    //   limit: 50,
    // });


    // const tradeHistory = await client?.getExecutionList({
    //   category: "linear",
    // });

    // const activeOrders = await client?.getActiveOrders({
    //   category: "linear",
    //   limit: 50,
    //   settleCoin: "USDT",
    // });

    // Full merged history (Redis/Postgres + one fresh Bybit page) instead of
    // Bybit's default 50-row page, so metrics cover every closed trade.
    const { trades } = await getMergedClosedPnL({
      userId: Number(userId),
      purchaseId: Number(purchaseId),
      client,
    });
    const closedPositions = { result: { list: trades } };




    const walletBalance = await client?.getWalletBalance({
      accountType: "UNIFIED",
      coin: "USDT",
    });



    return {
    //   orderHistory,
    //   tradeHistory,
    //   activeOrders,
      closedPositions,
    //   transactionLog,
      walletBalance,
    };
  } catch (error) {
    console.log(error);
  }
};

export default freshAccountData;
