import {Router} from "express";
//import {AuthController} from "../controllers/AuthController";
import {OwnerController} from "../controllers/owner.controller";

const router: Router = Router();

const ownerController: OwnerController = new OwnerController();
//const authController: AuthController = new AuthController();

//endpoints for owner
router.get("/ping", ownerController.pong);

router.post("/property-details", ownerController.addOwnerProperty);

router.post("/register-tenant", ownerController.tenantRegistration);

router.post("/properties", ownerController.getAllOwnerBuildings);

export default router;
