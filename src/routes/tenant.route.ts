import { Router } from 'express';
import { updateTenantPassword, getTenantDashboard } from '../controllers/tenant';

const router: Router = Router();

// endpoints for tenants

router.get('/ping', (req, res) => {
	res.status(200).send('Tenant pong');
});

router.put('/update-password', updateTenantPassword);

router.post('/dashboard', getTenantDashboard);

export default router;
