import { Router } from 'express';

import ownerRouter from './owner.router';
import tenantRouter from './tenant.route';
import authRouter from './auth.router';

import isAuth from '../middleware/is-auth';

const router: Router = Router();

router.use('/owner', isAuth, ownerRouter);
router.use('/tenant', isAuth, tenantRouter);
router.use('/auth', authRouter);

router.use('/health', (req, res) => {
	res.status(200).json({
		status: 'ok',
		env: process.env.ENV,
	});
});

export default router;
