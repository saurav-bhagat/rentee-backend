import {Router} from "express";
import {AuthController} from "../controllers/AuthController";

const router: Router = Router();

const authController: AuthController = new AuthController();

//endpoints for auth
router.post("/refresh-token", authController.handleRefreshToken);

router.post("/signup", authController.signUp);

router.post("/login", authController.authenticate);

router.put("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);

export default router;
