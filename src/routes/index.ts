import {Router} from "express";

import ownerRouter from "./owner.router";
import tenantRouter from "./tenant.route";

const router: Router = Router();

router.use("/owner", ownerRouter);
router.use("/tenant", tenantRouter);

export default router;
