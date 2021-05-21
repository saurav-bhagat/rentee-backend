import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import isAuth from "../middleware/is-auth";

const router: Router = Router();

const authController: AuthController = new AuthController();

//endpoints for auth
router.post("/refresh-token", authController.handleRefreshToken);

router.post("/signup", authController.signUp);

router.post("/login", authController.phoneAuthenticate);

router.put("/forgot-password", authController.forgotPassword);

router.post("/reset-password", authController.resetPassword);

router.post("/send-sms", authController.sendSms);

router.post("/verify-sms", authController.verifySms);

router.get("/protected", isAuth, (req: any, res: any) => {
	console.log(req.user);
	console.log(req.isAuth);
	res.send("success");
});

export default router;
