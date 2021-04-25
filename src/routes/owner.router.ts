import {Router} from "express";
//import {AuthController} from "../controllers/AuthController";
import {OwnerController} from "../controllers/owner.controller";

const router: Router = Router();

const ownerController: OwnerController = new OwnerController();
//const authController: AuthController = new AuthController();

//endpoints for owner
router.get("/ping", ownerController.pong);

//router.get("/details", authController.verifyUser);

export default router;
