import { Router } from "express";
import { TenantController } from "../controllers/tenant.controller";

const router: Router = Router();

const tenantController: TenantController = new TenantController();

//endpoints for tenants

router.get("/ping", (req, res, next) => {
	res.status(200).send("Tenant pong");
});

router.put("/update-password", tenantController.updateTenantPassword);

// /tenant/info
router.post("/info", tenantController.tenantInfo);

export default router;
