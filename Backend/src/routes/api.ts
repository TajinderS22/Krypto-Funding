import { Router } from "express";
import userRouter from "./user/user.js";
import adminRouter from "./admin/admin.js";
import bybitRouter from "./core/bybit.js";

const apiRouter = Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/core", bybitRouter);

export default apiRouter;
