import { Router } from "express";
import userMiddleware from "../user/middleware/middleware.js";
import freshAccountData from "../../service/bybit/refreshAccountStatus.js";
import { getBalanceHistory } from "../../service/bybit/balanceHistory.js";

const bybitRouter = Router();

bybitRouter.post("/status-update", userMiddleware, async (req, res) => {
  const userId = (req as any).user_id.user.id;
  const { challengeId, purchaseId } = req.body;


  try {
    const data = await freshAccountData({ userId, challengeId, purchaseId });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
  }
});

bybitRouter.get("/balance-history", userMiddleware, async (req, res) => {
  const userId = (req as any).user_id.user.id;
  const purchaseId = Number(req.query.purchaseId);
  const challengeId =
    typeof req.query.challengeId === "string" ? req.query.challengeId : undefined;

  if (!Number.isFinite(purchaseId)) {
    res.status(400).json({ error: "purchaseId is required" });
    return;
  }

  try {
    const history = await getBalanceHistory({ userId, purchaseId, challengeId });
    res.status(200).json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not load balance history" });
  }
});


export default bybitRouter;
