import { Router } from 'express';

import ownerRouter from './owner.router';
import tenantRouter from './tenant.route';
import authRouter from './auth.router';
import paytmRouter from './paytm.router';
import isAuth from '../middleware/is-auth';

const router: Router = Router();

router.use('/owner', isAuth, ownerRouter);
router.use('/tenant', isAuth, tenantRouter);
router.use('/auth', authRouter);
router.use('/payment', paytmRouter);

export default router;
