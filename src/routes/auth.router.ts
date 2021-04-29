import {Router} from "express";
import {AuthController} from "../controllers/AuthController";

const router: Router = Router();

const authController: AuthController = new AuthController();

//endpoints for auth
router.post("/refresh-token", authController.handleRefreshToken);

router.post("/signup", authController.signUp);

router.post("/login", authController.authenticate);

router.post("/send-sms", authController.sendSms);

router.post("/verify-sms", authController.verifySms);


router.post('/send-details',authController.sendDetails)

export default router;
