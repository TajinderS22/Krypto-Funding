import { Router } from "express";
import userMiddleware from "../user/middleware/middleware.js";
import freshAccountData from "../../service/bybit/refreshAccountStatus.js";

const bybitRouter = Router();

bybitRouter.post("/status-update", userMiddleware, async (req, res) => {
  const userId = (req as any).user_id.user.id;
  const { challengeId, purchaseId } = req.body;

  console.log(challengeId,"challengeId")

  try {
    const data = await freshAccountData({ userId, challengeId, purchaseId });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
  }
});


export default bybitRouter;
