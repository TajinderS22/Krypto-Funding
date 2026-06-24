import { Router } from "express";
import userRouter from "./user/user.js";
import adminRouter from "./admin/admin.js";

const apiRouter = Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/admin", adminRouter);

export default apiRouter