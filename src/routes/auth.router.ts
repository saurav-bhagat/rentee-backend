import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import isAuth from '../middleware/is-auth';

const router: Router = Router();

const authController: AuthController = new AuthController();

// endpoints for auth
router.post('/send-otp', authController.sendOtpOnLogin);

router.post('/authenticate', authController.phoneAuthenticate);

router.post('/refresh-token', authController.handleRefreshToken);

router.put('/forgot-password', authController.forgotPassword);

router.post('/reset-password', authController.resetPassword);

router.put('/update-basic-info', authController.updateUserBasicInfo);

router.get('/protected', isAuth, (req: any, res: any) => {
	console.log(req.user);
	console.log(req.isAuth);
	res.send('success');
});

export default router;
