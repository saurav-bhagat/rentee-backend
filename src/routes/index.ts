import {Router} from "express";

import ownerRouter from "./owner.router";
import tenantRouter from "./tenant.route";
import authRouter from "./auth.router";

const router: Router = Router();

router.use("/owner", ownerRouter);
router.use("/tenant", tenantRouter);
router.use("/auth", authRouter);

export default router;
