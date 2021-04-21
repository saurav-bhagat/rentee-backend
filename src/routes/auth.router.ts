import {Router} from "express";
import {AuthController} from "../controllers/AuthController";

const router: Router = Router();

const authController: AuthController = new AuthController();

//endpoints for auth
router.post("/refresh-token", authController.handleRefreshToken);

router.get("/login", authController.login);

export default router;
